import { PGlite } from '@electric-sql/pglite'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { sql } from 'drizzle-orm'
import { MockLanguageModelV4 } from 'ai/test'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  AgentsInfoSchema,
  ApiErrorSchema,
  type PrioritizeResponse,
  PrioritizeResponseSchema,
  type TaskPriority,
  type TaskStatus,
} from '@devlog/shared'

import { AppModule } from '../app.module.js'
import { configureHttp } from '../app.setup.js'
import { validateEnv } from '../config/env.schema.js'
import type { Database } from '../db/database.js'
import { DRIZZLE, PGLITE } from '../db/db.tokens.js'
import { tasks } from '../db/schema/index.js'
import { type LlmConnection, createLlmConnection } from '../llm/llm-connection.js'
import { LLM } from '../llm/llm.tokens.js'
import { badRequestError, rateLimitError, timeoutAbortError } from '../llm/mock/mock-failures.js'
import { PRIORITIZE_MOCK_SCRIPT, submitListedOrder } from '../llm/mock/prioritize-mock-script.js'
import {
  type MockScript,
  createScriptedModel,
  failingStep,
  toolCallStep,
} from '../llm/mock/scripted-model.js'

const E2E_MODEL_ID = 'e2e-mock'
const MISSING_TASK_ID = 999_999
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_STEPS = 6

type SeedTask = {
  key: string
  priority: TaskPriority
  status: TaskStatus
  createdDaysAgo: number
}

const SEED_TASKS: SeedTask[] = [
  { key: 'freshHigh', priority: 'high', status: 'todo', createdDaysAgo: 0 },
  { key: 'twoWeekMedium', priority: 'medium', status: 'todo', createdDaysAgo: 14 },
  { key: 'freshLowInProgress', priority: 'low', status: 'in-progress', createdDaysAgo: 0 },
  { key: 'oldMedium', priority: 'medium', status: 'todo', createdDaysAgo: 20 },
  { key: 'weekLow', priority: 'low', status: 'todo', createdDaysAgo: 7 },
  { key: 'weekHighInProgress', priority: 'high', status: 'in-progress', createdDaysAgo: 7 },
  { key: 'doneHigh', priority: 'high', status: 'done', createdDaysAgo: 3 },
]

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

const insertTasks = async (db: Database, seeds: SeedTask[]): Promise<Map<string, number>> => {
  const now = Date.now()
  const inserted = await db
    .insert(tasks)
    .values(
      seeds.map((seed) => {
        const createdAt = new Date(now - seed.createdDaysAgo * DAY_MS)
        return {
          title: seed.key,
          status: seed.status,
          priority: seed.priority,
          createdAt,
          updatedAt: createdAt,
          completedAt: seed.status === 'done' ? createdAt : null,
        }
      }),
    )
    .returning({ id: tasks.id, title: tasks.title })
  return new Map(inserted.map(({ id, title }) => [title, id]))
}

describe('AgentsController (e2e)', () => {
  let app: NestExpressApplication
  let db: Database
  let taskIds: Map<string, number>
  let script: MockScript = PRIORITIZE_MOCK_SCRIPT
  let modelCallCount = 0

  const delegatingModel = new MockLanguageModelV4({
    provider: 'mock',
    modelId: E2E_MODEL_ID,
    doGenerate: (options) => {
      modelCallCount += 1
      return createScriptedModel(script).doGenerate(options)
    },
  })

  const api = () => request(app.getHttpServer())

  const idOf = (key: string): number => {
    const id = taskIds.get(key)
    if (id === undefined) throw new Error(`No seeded task ${key}`)
    return id
  }

  const prioritize = async (): Promise<PrioritizeResponse> => {
    const response = await api().post('/agents/prioritize').send({}).expect(200)
    return PrioritizeResponseSchema.parse(response.body)
  }

  const openTaskIds = (): number[] =>
    SEED_TASKS.filter(({ status }) => status !== 'done').map(({ key }) => idOf(key))

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
    taskIds = await insertTasks(db, SEED_TASKS)
    script = PRIORITIZE_MOCK_SCRIPT
    modelCallCount = 0
  })

  describe('GET /agents', () => {
    it('names the provider, the model and the prioritize agent', async () => {
      const response = await api().get('/agents').expect(200)

      expect(AgentsInfoSchema.parse(response.body)).toEqual({
        isConfigured: true,
        provider: 'mock',
        modelId: E2E_MODEL_ID,
        agents: [
          { name: 'prioritize', maxSteps: MAX_STEPS, tools: ['list_tasks', 'get_task', 'submit_plan'] },
        ],
      })
    })
  })

  describe('POST /agents/prioritize', () => {
    it('returns 3 to 5 open tasks from the model after reading a task first', async () => {
      const { plan, meta, trace } = await prioritize()

      expect(plan.focus.length).toBeGreaterThanOrEqual(3)
      expect(plan.focus.length).toBeLessThanOrEqual(5)
      expect(openTaskIds()).toEqual(expect.arrayContaining(plan.focus.map(({ taskId }) => taskId)))
      expect(meta).toMatchObject({ source: 'llm', stoppedBy: 'submitted', modelId: E2E_MODEL_ID })
      expect(trace.length).toBeGreaterThanOrEqual(2)
      expect(trace.flatMap(({ toolCalls }) => toolCalls.map(({ toolName }) => toolName))).toEqual([
        'list_tasks',
        'get_task',
        'submit_plan',
      ])
    })

    it('lets the model fix a rejected submit and keeps the rejected attempt in the trace', async () => {
      const doneId = idOf('doneHigh')
      script = [
        toolCallStep('list_tasks', {}),
        toolCallStep('submit_plan', {
          focus: [{ taskId: doneId, reason: 'Looks urgent' }],
          later: [],
          summary: 'Done task first',
        }),
        submitListedOrder,
      ]

      const { plan, meta, trace } = await prioritize()

      const rejected = trace[1]?.toolCalls[0]
      expect(meta).toMatchObject({ source: 'llm', stoppedBy: 'submitted', steps: 3 })
      expect(rejected).toMatchObject({ toolName: 'submit_plan', isRejectedSubmit: true })
      expect(rejected?.output).toContain(`Task ${doneId} does not exist or is done`)
      expect(trace[2]?.toolCalls[0]?.isRejectedSubmit).toBe(false)
      expect(plan.focus.map(({ taskId }) => taskId)).not.toContain(doneId)
    })

    it('falls back to the formula when every submit is invalid up to the step limit', async () => {
      script = [
        toolCallStep('list_tasks', {}),
        toolCallStep('submit_plan', {
          focus: [{ taskId: MISSING_TASK_ID, reason: 'Invented' }],
          later: [],
          summary: 'Invented plan',
        }),
      ]

      const { plan, meta, trace } = await prioritize()

      expect(meta).toMatchObject({
        source: 'fallback',
        stoppedBy: 'step-limit',
        fallbackReason: 'invalid-output',
        steps: MAX_STEPS,
      })
      expect(plan.focus.map(({ taskId }) => taskId)).toEqual(
        ['weekHighInProgress', 'oldMedium', 'twoWeekMedium', 'freshHigh', 'freshLowInProgress'].map(
          idOf,
        ),
      )
      expect(plan.later).toEqual([idOf('weekLow')])
      expect(trace.slice(1).every(({ toolCalls }) => toolCalls[0]?.isRejectedSubmit)).toBe(true)
    })

    it.each([
      ['rate-limited', rateLimitError()],
      ['timeout', timeoutAbortError()],
      ['llm-error', badRequestError()],
    ])('falls back with %s and keeps the steps that ran', async (fallbackReason, error) => {
      script = [toolCallStep('list_tasks', {}), failingStep(error)]

      const { plan, meta, trace } = await prioritize()

      expect(meta).toMatchObject({ source: 'fallback', stoppedBy: 'error', fallbackReason, steps: 1 })
      expect(trace).toHaveLength(1)
      expect(trace[0]?.toolCalls[0]?.toolName).toBe('list_tasks')
      expect(plan.focus).toHaveLength(5)
    })

    it('skips the model when every task is done', async () => {
      await db.execute(sql`update ${tasks} set status = 'done', completed_at = now()`)

      const { plan, meta, trace } = await prioritize()

      expect(modelCallCount).toBe(0)
      expect(meta).toMatchObject({ stoppedBy: 'skipped', steps: 0 })
      expect(plan.focus).toEqual([])
      expect(plan.later).toEqual([])
      expect(trace).toEqual([])
    })

    it('gives the model an error result for a missing task id and goes on', async () => {
      script = [
        toolCallStep('get_task', { id: MISSING_TASK_ID }),
        toolCallStep('list_tasks', {}),
        submitListedOrder,
      ]

      const { meta, trace } = await prioritize()

      expect(trace[0]?.toolCalls[0]).toMatchObject({ toolName: 'get_task', isError: false })
      expect(trace[0]?.toolCalls[0]?.output).toContain(`Task ${MISSING_TASK_ID} not found`)
      expect(meta).toMatchObject({ source: 'llm', stoppedBy: 'submitted', steps: 3 })
    })

    it('answers 400 for an unknown body field', async () => {
      const response = await api().post('/agents/prioritize').send({ limit: 3 }).expect(400)

      expect(ApiErrorSchema.parse(response.body).code).toBe('VALIDATION_FAILED')
    })
  })
})

describe('AgentsController without an LLM key (e2e)', () => {
  let app: NestExpressApplication

  beforeAll(async () => {
    app = await createApp(createLlmConnection(validateEnv({})))
  })

  afterAll(async () => {
    await app.close()
  })

  it('still serves the tracker', async () => {
    await request(app.getHttpServer()).post('/tasks').send({ title: 'Works offline' }).expect(201)
    await request(app.getHttpServer()).get('/tasks').expect(200)
  })

  it('says the LLM is not configured', async () => {
    const response = await request(app.getHttpServer()).get('/agents').expect(200)

    expect(AgentsInfoSchema.parse(response.body)).toMatchObject({
      isConfigured: false,
      provider: 'google',
      modelId: null,
    })
  })

  it('answers 503 LLM_NOT_CONFIGURED for prioritize', async () => {
    const response = await request(app.getHttpServer())
      .post('/agents/prioritize')
      .send({})
      .expect(503)

    expect(ApiErrorSchema.parse(response.body)).toMatchObject({
      statusCode: 503,
      code: 'LLM_NOT_CONFIGURED',
    })
  })
})
