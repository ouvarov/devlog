import { PGlite } from '@electric-sql/pglite'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { MockLanguageModelV4 } from 'ai/test'
import { count, sql } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  ApiErrorSchema,
  type DecomposeRequest,
  type DecomposeResponse,
  DecomposeResponseSchema,
} from '@devlog/shared'

import { AppModule } from '../../app.module.js'
import { configureHttp } from '../../app.setup.js'
import type { Database } from '../../db/database.js'
import { DRIZZLE, PGLITE } from '../../db/db.tokens.js'
import { tasks } from '../../db/schema/index.js'
import type { LlmConnection } from '../../llm/llm-connection.js'
import { LLM } from '../../llm/llm.tokens.js'
import { submitPartsOfTaskTitle } from '../../llm/mock/decompose-mock-script.js'
import { pickDemoMockScript } from '../../llm/mock/demo-mock-scripts.js'
import { badRequestError, rateLimitError } from '../../llm/mock/mock-failures.js'
import {
  type MockCallOptions,
  type MockScript,
  type MockScriptPicker,
  createScriptedModel,
  failingStep,
  toolCallStep,
} from '../../llm/mock/scripted-model.js'

const E2E_MODEL_ID = 'e2e-mock'
const MISSING_TASK_ID = 999_999
const MAX_STEPS = 6
const EXISTING_SUBTASK_TITLE = 'Profile the slow pages'

type SeededTaskIds = {
  vague: number
  subtask: number
  done: number
}

const createApp = async (llm: LlmConnection): Promise<NestExpressApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PGLITE)
    .useFactory({ factory: () => PGlite.create('memory://') })
    .overrideProvider(LLM)
    .useValue(llm)
    .compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false })
  configureHttp(app)
  return app.init()
}

const seedTasks = async (db: Database): Promise<SeededTaskIds> => {
  const [vague, done] = await db
    .insert(tasks)
    .values([
      { title: 'Improve performance', priority: 'medium' },
      { title: 'Ship the release', status: 'done', completedAt: new Date() },
      { title: 'Reach 100% test coverage' },
      { title: 'Support 1000 users at once' },
    ])
    .returning({ id: tasks.id })
  if (!vague || !done) throw new Error('Seeding failed')

  const [subtask] = await db
    .insert(tasks)
    .values({ title: EXISTING_SUBTASK_TITLE, parentId: vague.id })
    .returning({ id: tasks.id })
  if (!subtask) throw new Error('Seeding the subtask failed')

  return { vague: vague.id, subtask: subtask.id, done: done.id }
}

const toolNamesOf = (options: MockCallOptions | undefined): string[] =>
  options?.tools?.map(({ name }) => name) ?? []

const traceToolNamesOf = (response: DecomposeResponse): string[] =>
  response.trace.flatMap(({ toolCalls }) => toolCalls.map(({ toolName }) => toolName))

const invalidSubmit = (titles: string[]) =>
  toolCallStep('submit_subtasks', {
    items: titles.map((title) => ({ title })),
    assumptions: ['Assumed for the test'],
  })

describe('POST /agents/decompose (e2e)', () => {
  let app: NestExpressApplication
  let db: Database
  let taskIds: SeededTaskIds
  let script: MockScript | MockScriptPicker = pickDemoMockScript
  let modelCalls: MockCallOptions[] = []

  const delegatingModel = new MockLanguageModelV4({
    provider: 'mock',
    modelId: E2E_MODEL_ID,
    doGenerate: (options) => {
      modelCalls.push(options)
      return createScriptedModel(script).doGenerate(options)
    },
  })

  const api = () => request(app.getHttpServer())

  const decompose = async (body: DecomposeRequest): Promise<DecomposeResponse> => {
    const response = await api().post('/agents/decompose').send(body).expect(200)
    return DecomposeResponseSchema.parse(response.body)
  }

  const countTasks = async (): Promise<number> => {
    const [row] = await db.select({ total: count() }).from(tasks)
    return row?.total ?? 0
  }

  beforeAll(async () => {
    app = await createApp({
      isConfigured: true,
      provider: 'mock',
      modelId: E2E_MODEL_ID,
      model: delegatingModel,
    })
    db = app.get<Database>(DRIZZLE)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await db.execute(sql`truncate table ${tasks} restart identity`)
    taskIds = await seedTasks(db)
    script = pickDemoMockScript
    modelCalls = []
  })

  describe('with the demo mock', () => {
    it('asks 1 to 3 questions about a vague task after a search', async () => {
      const response = await decompose({ taskId: taskIds.vague })

      expect(response.kind).toBe('clarify')
      const questions = response.kind === 'clarify' ? response.questions : []
      expect(questions.length).toBeGreaterThanOrEqual(1)
      expect(questions.length).toBeLessThanOrEqual(3)
      expect(response.meta).toMatchObject({ source: 'llm', stoppedBy: 'submitted' })
      expect(traceToolNamesOf(response)).toEqual(['search_tasks', 'ask_clarification'])
      expect(toolNamesOf(modelCalls[0])).toEqual([
        'search_tasks',
        'ask_clarification',
        'submit_subtasks',
      ])
    })

    it('proposes 3 to 8 subtasks after the answers, without offering ask_clarification', async () => {
      const clarify = await decompose({ taskId: taskIds.vague })
      const questions = clarify.kind === 'clarify' ? clarify.questions : []
      modelCalls = []

      const response = await decompose({
        taskId: taskIds.vague,
        clarification: { questions, answers: questions.map(() => 'The task list page') },
      })

      expect(response.kind).toBe('proposal')
      const items = response.kind === 'proposal' ? response.items : []
      expect(items.length).toBeGreaterThanOrEqual(3)
      expect(items.length).toBeLessThanOrEqual(8)
      expect(items.map(({ title }) => title)).not.toContain(EXISTING_SUBTASK_TITLE)
      expect(items.every(({ status }) => status === 'todo')).toBe(true)
      expect(modelCalls.length).toBeGreaterThan(0)
      expect(modelCalls.flatMap(toolNamesOf)).not.toContain('ask_clarification')
      expect(JSON.stringify(modelCalls[0]?.prompt)).toContain('The task list page')
    })

    it('proposes subtasks with an assumption when the user wants no questions', async () => {
      const response = await decompose({ taskId: taskIds.vague, skipClarification: true })

      expect(response.kind).toBe('proposal')
      const proposal = response.kind === 'proposal' ? response : undefined
      expect(proposal?.items.length).toBeGreaterThanOrEqual(3)
      expect(proposal?.assumptions.length).toBeGreaterThanOrEqual(1)
      expect(modelCalls.flatMap(toolNamesOf)).not.toContain('ask_clarification')
    })
  })

  describe('before the model', () => {
    it('answers 404 for an unknown task without calling the model', async () => {
      const response = await api()
        .post('/agents/decompose')
        .send({ taskId: MISSING_TASK_ID })
        .expect(404)

      expect(ApiErrorSchema.parse(response.body).code).toBe('NOT_FOUND')
      expect(modelCalls).toHaveLength(0)
    })

    it.each([
      ['a subtask', 'subtask'],
      ['a done task', 'done'],
    ] as const)('answers 400 for %s without calling the model', async (_case, key) => {
      const response = await api()
        .post('/agents/decompose')
        .send({ taskId: taskIds[key] })
        .expect(400)

      expect(ApiErrorSchema.parse(response.body).code).toBe('BAD_REQUEST')
      expect(modelCalls).toHaveLength(0)
    })

    it('answers 400 with issues when the answers do not match the questions', async () => {
      const response = await api()
        .post('/agents/decompose')
        .send({
          taskId: taskIds.vague,
          clarification: { questions: ['Which pages?', 'How fast?'], answers: ['The list'] },
        })
        .expect(400)

      const apiError = ApiErrorSchema.parse(response.body)
      expect(apiError.code).toBe('VALIDATION_FAILED')
      expect(apiError.issues).toEqual([
        expect.objectContaining({ path: ['clarification', 'answers'] }),
      ])
      expect(modelCalls).toHaveLength(0)
    })

    it('answers 400 with issues for clarification together with skipClarification', async () => {
      const response = await api()
        .post('/agents/decompose')
        .send({
          taskId: taskIds.vague,
          clarification: { questions: ['Which pages?'], answers: ['The list'] },
          skipClarification: true,
        })
        .expect(400)

      const apiError = ApiErrorSchema.parse(response.body)
      expect(apiError.code).toBe('VALIDATION_FAILED')
      expect(apiError.issues).toEqual([expect.objectContaining({ path: ['skipClarification'] })])
    })

    it('answers 400 for an empty answer and an unknown field', async () => {
      await api()
        .post('/agents/decompose')
        .send({
          taskId: taskIds.vague,
          clarification: { questions: ['Which pages?'], answers: ['   '] },
        })
        .expect(400)
      await api().post('/agents/decompose').send({ taskId: taskIds.vague, mode: 'fast' }).expect(400)
    })
  })

  describe('with scripted answers', () => {
    it.each([
      ['equal to an existing subtask', ['profile the  SLOW pages', 'Add an index', 'Cache it']],
      ['used twice', ['Add an index', 'add an INDEX', 'Cache it']],
    ])(
      'returns the proposal after a rejected submit with a title %s',
      async (_case, titles) => {
        script = [invalidSubmit(titles), submitPartsOfTaskTitle]

        const response = await decompose({ taskId: taskIds.vague, skipClarification: true })

        expect(response.kind).toBe('proposal')
        expect(response.meta).toMatchObject({ stoppedBy: 'submitted', steps: 2 })
        expect(response.trace[0]?.toolCalls[0]).toMatchObject({
          toolName: 'submit_subtasks',
          isRejectedSubmit: true,
        })
        expect(response.trace[1]?.toolCalls[0]?.isRejectedSubmit).toBe(false)
      },
    )

    it('answers 422 AGENT_FAILED with the trace when every submit is invalid', async () => {
      script = [invalidSubmit(['Only one'])]
      const taskCountBefore = await countTasks()

      const response = await api()
        .post('/agents/decompose')
        .send({ taskId: taskIds.vague, skipClarification: true })
        .expect(422)

      const apiError = ApiErrorSchema.parse(response.body)
      expect(apiError).toMatchObject({ statusCode: 422, code: 'AGENT_FAILED' })
      expect(apiError.message).toContain(`${MAX_STEPS} steps`)
      expect(apiError.trace).toHaveLength(MAX_STEPS)
      expect(apiError.trace?.every(({ toolCalls }) => toolCalls[0]?.isRejectedSubmit)).toBe(true)
      expect(await countTasks()).toBe(taskCountBefore)
    })

    it.each([
      ['a rate limit', rateLimitError(), 'rate limited'],
      ['a provider error', badRequestError(), 'model call failed'],
    ])('answers 422 AGENT_FAILED with the trace on %s', async (_case, error, message) => {
      script = [toolCallStep('search_tasks', { query: 'performance' }), failingStep(error)]

      const response = await api()
        .post('/agents/decompose')
        .send({ taskId: taskIds.vague })
        .expect(422)

      const apiError = ApiErrorSchema.parse(response.body)
      expect(apiError.code).toBe('AGENT_FAILED')
      expect(apiError.message).toContain(message)
      expect(apiError.trace?.[0]?.toolCalls[0]?.toolName).toBe('search_tasks')
    })

    it('treats % in a search word as a literal character', async () => {
      script = [toolCallStep('search_tasks', { query: '100%' }), submitPartsOfTaskTitle]

      const response = await decompose({ taskId: taskIds.vague, skipClarification: true })

      const searchOutput = response.trace[0]?.toolCalls[0]?.output ?? ''
      expect(searchOutput).toContain('Reach 100% test coverage')
      expect(searchOutput).not.toContain('Support 1000 users')
    })

    it('answers search_tasks with an error when every word is shorter than 3 characters', async () => {
      script = [toolCallStep('search_tasks', { query: 'a to' }), submitPartsOfTaskTitle]

      const response = await decompose({ taskId: taskIds.vague, skipClarification: true })

      expect(response.trace[0]?.toolCalls[0]?.output).toContain('at least 3 characters')
    })
  })
})
