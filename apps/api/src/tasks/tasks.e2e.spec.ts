import { PGlite } from '@electric-sql/pglite'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { count, sql } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  ApiErrorSchema,
  type BatchTasksResult,
  BatchTasksResultSchema,
  type CreateTask,
  MAX_BATCH_OPERATIONS,
  TASK_DESCRIPTION_MAX_LENGTH,
  type TaskDetail,
  TaskDetailSchema,
  type TaskListResponse,
  TaskListResponseSchema,
  type TaskView,
  TaskViewSchema,
} from '@devlog/shared'

import { AppModule } from '../app.module.js'
import { configureHttp } from '../app.setup.js'
import type { Database } from '../db/database.js'
import { DRIZZLE, PGLITE } from '../db/db.tokens.js'
import { tasks } from '../db/schema/index.js'

const PARALLEL_BATCH_SIZE = 10
const MISSING_TASK_ID = 999_999
const OUT_OF_INT32_RANGE_ID = 99_999_999_999

const createApp = async (): Promise<NestExpressApplication> => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PGLITE)
    .useFactory({ factory: () => PGlite.create('memory://') })
    .compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false })
  configureHttp(app)
  return app.init()
}

const createTasksInput = (prefix: string, total: number): CreateTask[] =>
  Array.from({ length: total }, (_, index) => ({ title: `${prefix} ${index + 1}` }))

describe('TasksController (e2e)', () => {
  let app: NestExpressApplication
  let db: Database

  const api = () => request(app.getHttpServer())

  const createTask = async (input: CreateTask): Promise<TaskView> => {
    const response = await api().post('/tasks').send(input).expect(201)
    return TaskViewSchema.parse(response.body)
  }

  const listTasks = async (query: string): Promise<TaskView[]> => {
    const response = await api().get(`/tasks${query}`).expect(200)
    const list: TaskListResponse = TaskListResponseSchema.parse(response.body)
    return list.items
  }

  const getTask = async (id: number): Promise<TaskDetail> => {
    const response = await api().get(`/tasks/${id}`).expect(200)
    return TaskDetailSchema.parse(response.body)
  }

  const countTasks = async (): Promise<number> => {
    const [row] = await db.select({ total: count() }).from(tasks)
    return row?.total ?? 0
  }

  const parseError = (body: unknown) => ApiErrorSchema.parse(body)

  beforeAll(async () => {
    app = await createApp()
    db = app.get<Database>(DRIZZLE)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await db.execute(sql`truncate table ${tasks} restart identity`)
  })

  describe('GET /tasks', () => {
    it('sorts by priority from high to low, newest first within a priority', async () => {
      const olderMedium = await createTask({ title: 'Older medium', priority: 'medium' })
      const low = await createTask({ title: 'Low', priority: 'low' })
      const high = await createTask({ title: 'High', priority: 'high' })
      const newerMedium = await createTask({ title: 'Newer medium', priority: 'medium' })

      const items = await listTasks('?sort=priority')

      expect(items.map(({ id }) => id)).toEqual([high.id, newerMedium.id, olderMedium.id, low.id])
    })

    it('sorts by priority from low to high with order=asc', async () => {
      await createTask({ title: 'High', priority: 'high' })
      await createTask({ title: 'Low', priority: 'low' })

      const items = await listTasks('?sort=priority&order=asc')

      expect(items.map(({ priority }) => priority)).toEqual(['low', 'high'])
    })

    it('sorts by creation time, newest first, by default', async () => {
      const first = await createTask({ title: 'First' })
      const second = await createTask({ title: 'Second' })

      const items = await listTasks('')

      expect(items.map(({ id }) => id)).toEqual([second.id, first.id])
    })

    it('returns only done tasks for status=done', async () => {
      await createTask({ title: 'Todo' })
      const done = await createTask({ title: 'Done', status: 'done' })

      const items = await listTasks('?status=done')

      expect(items.map(({ id }) => id)).toEqual([done.id])
    })

    it('returns only top-level tasks with subtask counts', async () => {
      const parent = await createTask({ title: 'Parent' })
      await createTask({ title: 'Open subtask', parentId: parent.id })
      await createTask({ title: 'Done subtask', parentId: parent.id, status: 'done' })
      const single = await createTask({ title: 'Single' })

      const items = await listTasks('')

      expect(items.map(({ id }) => id)).toEqual([single.id, parent.id])
      expect(items.find(({ id }) => id === parent.id)).toMatchObject({
        subtaskCount: 2,
        subtaskDoneCount: 1,
      })
      expect(items.find(({ id }) => id === single.id)).toMatchObject({
        subtaskCount: 0,
        subtaskDoneCount: 0,
      })
    })

    it('rejects an unknown query parameter', async () => {
      const response = await api().get('/tasks?owner=me').expect(400)

      expect(parseError(response.body).issues).toEqual([
        { path: ['owner'], message: 'Unrecognized field' },
      ])
    })

    it('rejects an unknown status', async () => {
      const response = await api().get('/tasks?status=blocked').expect(400)

      expect(parseError(response.body).issues?.[0]?.path).toEqual(['status'])
    })
  })

  describe('GET /tasks/:id', () => {
    it('returns the task with its subtasks and no parent', async () => {
      const parent = await createTask({ title: 'Parent' })
      const subtask = await createTask({ title: 'Subtask', parentId: parent.id })

      const detail = await getTask(parent.id)

      expect(detail.parent).toBeNull()
      expect(detail.subtasks.map(({ id }) => id)).toEqual([subtask.id])
      expect(detail.subtaskCount).toBe(1)
    })

    it('returns a subtask with its parent', async () => {
      const parent = await createTask({ title: 'Parent' })
      const subtask = await createTask({ title: 'Subtask', parentId: parent.id })

      const detail = await getTask(subtask.id)

      expect(detail.parent).toEqual({ id: parent.id, title: 'Parent' })
      expect(detail.subtasks).toEqual([])
    })

    it('returns 404 NOT_FOUND for an unknown id', async () => {
      const response = await api().get(`/tasks/${MISSING_TASK_ID}`).expect(404)

      expect(parseError(response.body)).toEqual({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `Task ${MISSING_TASK_ID} not found`,
      })
    })

    it('returns 400 for a non-numeric id', async () => {
      const response = await api().get('/tasks/abc').expect(400)

      expect(parseError(response.body).code).toBe('VALIDATION_FAILED')
    })

    it('returns 400 for an id outside the integer range', async () => {
      const response = await api().get(`/tasks/${OUT_OF_INT32_RANGE_ID}`).expect(400)

      expect(parseError(response.body).code).toBe('VALIDATION_FAILED')
    })
  })

  describe('POST /tasks', () => {
    it('creates a task with defaults', async () => {
      const response = await api().post('/tasks').send({ title: '  Write docs  ' }).expect(201)

      expect(TaskViewSchema.parse(response.body)).toMatchObject({
        title: 'Write docs',
        description: '',
        status: 'todo',
        priority: 'medium',
        parentId: null,
        subtaskCount: 0,
        completedAt: null,
      })
    })

    it('rejects an unknown field and names its path', async () => {
      const response = await api().post('/tasks').send({ title: 'Task', ownerId: 7 }).expect(400)

      expect(parseError(response.body)).toEqual({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        issues: [{ path: ['ownerId'], message: 'Unrecognized field' }],
      })
    })

    it('rejects an empty title', async () => {
      const response = await api().post('/tasks').send({ title: '   ' }).expect(400)

      expect(parseError(response.body).issues?.map(({ path }) => path)).toEqual([['title']])
    })

    it('rejects a body that is not valid JSON', async () => {
      const response = await api()
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title":')
        .expect(400)

      expect(parseError(response.body).code).toBe('VALIDATION_FAILED')
    })

    it('rejects a subtask as parent', async () => {
      const parent = await createTask({ title: 'Parent' })
      const subtask = await createTask({ title: 'Subtask', parentId: parent.id })

      const response = await api()
        .post('/tasks')
        .send({ title: 'Nested', parentId: subtask.id })
        .expect(400)

      expect(parseError(response.body).code).toBe('VALIDATION_FAILED')
    })

    it('returns 404 for a missing parent', async () => {
      const response = await api()
        .post('/tasks')
        .send({ title: 'Orphan', parentId: MISSING_TASK_ID })
        .expect(404)

      expect(parseError(response.body).code).toBe('NOT_FOUND')
    })

    it('rejects a done task as parent', async () => {
      const done = await createTask({ title: 'Done', status: 'done' })

      const response = await api()
        .post('/tasks')
        .send({ title: 'Late subtask', parentId: done.id })
        .expect(400)

      expect(parseError(response.body).message).toBe(
        `Task ${done.id} is done and cannot get new subtasks`,
      )
    })
  })

  describe('PATCH /tasks/:id', () => {
    it('sets completedAt on done and clears it on the way back to todo', async () => {
      const task = await createTask({ title: 'Task' })

      const done = await api().patch(`/tasks/${task.id}`).send({ status: 'done' }).expect(200)
      expect(TaskViewSchema.parse(done.body).completedAt).not.toBeNull()

      const reopened = await api().patch(`/tasks/${task.id}`).send({ status: 'todo' }).expect(200)
      expect(TaskViewSchema.parse(reopened.body).completedAt).toBeNull()
    })

    it('keeps completedAt when a done task is edited', async () => {
      const task = await createTask({ title: 'Task', status: 'done' })

      const renamed = await api()
        .patch(`/tasks/${task.id}`)
        .send({ title: 'Renamed', status: 'done' })
        .expect(200)

      expect(TaskViewSchema.parse(renamed.body).completedAt).toBe(task.completedAt)
    })

    it('moves a parent with open subtasks to done', async () => {
      const parent = await createTask({ title: 'Parent' })
      await createTask({ title: 'Open subtask', parentId: parent.id })

      const response = await api().patch(`/tasks/${parent.id}`).send({ status: 'done' }).expect(200)

      expect(TaskViewSchema.parse(response.body)).toMatchObject({
        status: 'done',
        subtaskCount: 1,
        subtaskDoneCount: 0,
      })
    })

    it('rejects an empty change set', async () => {
      const task = await createTask({ title: 'Task' })

      const response = await api().patch(`/tasks/${task.id}`).send({}).expect(400)

      expect(parseError(response.body).issues).toEqual([
        { path: [], message: 'At least one field must be changed' },
      ])
    })

    it('rejects a parentId change', async () => {
      const parent = await createTask({ title: 'Parent' })
      const task = await createTask({ title: 'Task' })

      const response = await api()
        .patch(`/tasks/${task.id}`)
        .send({ parentId: parent.id })
        .expect(400)

      expect(parseError(response.body).issues).toEqual([
        { path: ['parentId'], message: 'Unrecognized field' },
      ])
    })

    it('returns 404 for an unknown id', async () => {
      await api().patch(`/tasks/${MISSING_TASK_ID}`).send({ title: 'Ghost' }).expect(404)
    })
  })

  describe('DELETE /tasks/:id', () => {
    it('deletes a parent together with its subtasks', async () => {
      const parent = await createTask({ title: 'Parent' })
      const subtask = await createTask({ title: 'Subtask', parentId: parent.id })

      await api().delete(`/tasks/${parent.id}`).expect(204)

      await api().get(`/tasks/${parent.id}`).expect(404)
      await api().get(`/tasks/${subtask.id}`).expect(404)
      expect(await countTasks()).toBe(0)
    })

    it('returns 404 for an unknown id', async () => {
      await api().delete(`/tasks/${MISSING_TASK_ID}`).expect(404)
    })
  })

  describe('POST /tasks/batch', () => {
    it('creates and updates tasks in one call', async () => {
      const parent = await createTask({ title: 'Parent' })

      const response = await api()
        .post('/tasks/batch')
        .send({
          create: [
            { title: 'Subtask', parentId: parent.id },
            { title: 'Already done', status: 'done', priority: 'high' },
          ],
          update: [{ id: parent.id, changes: { status: 'in-progress' } }],
        })
        .expect(200)

      const result: BatchTasksResult = BatchTasksResultSchema.parse(response.body)
      expect(result.created.map(({ title }) => title)).toEqual(['Subtask', 'Already done'])
      expect(result.created[0]?.parentId).toBe(parent.id)
      expect(result.created[1]?.completedAt).not.toBeNull()
      expect(result.updated).toEqual([
        expect.objectContaining({ id: parent.id, status: 'in-progress', subtaskCount: 1 }),
      ])
    })

    it('changes nothing when an operation fails schema validation', async () => {
      const task = await createTask({ title: 'Task' })

      const response = await api()
        .post('/tasks/batch')
        .send({
          create: [{ title: 'New' }],
          update: [{ id: task.id, changes: { status: 'done', extra: true } }],
        })
        .expect(400)

      expect(parseError(response.body).issues).toEqual([
        { path: ['update', 0, 'changes', 'extra'], message: 'Unrecognized field' },
      ])
      expect(await countTasks()).toBe(1)
      expect((await getTask(task.id)).status).toBe('todo')
    })

    it('rolls back earlier operations when a later one breaks a task rule', async () => {
      const parent = await createTask({ title: 'Parent' })
      const subtask = await createTask({ title: 'Subtask', parentId: parent.id })

      await api()
        .post('/tasks/batch')
        .send({
          create: [{ title: 'Valid' }, { title: 'Nested', parentId: subtask.id }],
          update: [{ id: parent.id, changes: { title: 'Renamed' } }],
        })
        .expect(400)

      expect(await countTasks()).toBe(2)
      expect((await getTask(parent.id)).title).toBe('Parent')
    })

    it('rolls back the creates when an update targets a missing task', async () => {
      await api()
        .post('/tasks/batch')
        .send({
          create: [{ title: 'New' }],
          update: [{ id: MISSING_TASK_ID, changes: { status: 'done' } }],
        })
        .expect(404)

      expect(await countTasks()).toBe(0)
    })

    it('accepts the largest batch the schema allows with Cyrillic descriptions', async () => {
      const create = Array.from({ length: MAX_BATCH_OPERATIONS }, (_, index) => ({
        title: `Задача ${index + 1}`,
        description: 'ж'.repeat(TASK_DESCRIPTION_MAX_LENGTH),
      }))

      const response = await api().post('/tasks/batch').send({ create, update: [] }).expect(200)

      expect(BatchTasksResultSchema.parse(response.body).created).toHaveLength(MAX_BATCH_OPERATIONS)
    })

    it('rejects an empty batch', async () => {
      await api().post('/tasks/batch').send({ create: [], update: [] }).expect(400)
    })

    it('rejects more than 20 operations', async () => {
      await api()
        .post('/tasks/batch')
        .send({ create: createTasksInput('Task', 21), update: [] })
        .expect(400)

      expect(await countTasks()).toBe(0)
    })
  })

  describe('POST /tasks/batch in parallel', () => {
    it('applies two parallel valid batches completely', async () => {
      const sharedTask = await createTask({ title: 'Shared task' })

      const [first, second] = await Promise.all([
        api()
          .post('/tasks/batch')
          .send({
            create: createTasksInput('First', PARALLEL_BATCH_SIZE),
            update: [{ id: sharedTask.id, changes: { priority: 'high' } }],
          }),
        api()
          .post('/tasks/batch')
          .send({
            create: createTasksInput('Second', PARALLEL_BATCH_SIZE),
            update: [{ id: sharedTask.id, changes: { status: 'in-progress' } }],
          }),
      ])

      expect(first.status).toBe(200)
      expect(second.status).toBe(200)
      const createdIds = [first, second].flatMap((response) =>
        BatchTasksResultSchema.parse(response.body).created.map(({ id }) => id),
      )
      expect(new Set(createdIds).size).toBe(PARALLEL_BATCH_SIZE * 2)
      expect(await countTasks()).toBe(1 + PARALLEL_BATCH_SIZE * 2)
      expect(await getTask(sharedTask.id)).toMatchObject({
        priority: 'high',
        status: 'in-progress',
      })
    })

    it('rolls back only the failing batch when a valid one runs in parallel', async () => {
      const [valid, failing] = await Promise.all([
        api()
          .post('/tasks/batch')
          .send({ create: createTasksInput('Valid', PARALLEL_BATCH_SIZE), update: [] }),
        api()
          .post('/tasks/batch')
          .send({
            create: createTasksInput('Failing', PARALLEL_BATCH_SIZE),
            update: [{ id: MISSING_TASK_ID, changes: { status: 'done' } }],
          }),
      ])

      expect(valid.status).toBe(200)
      expect(failing.status).toBe(404)
      expect(await countTasks()).toBe(PARALLEL_BATCH_SIZE)
      const titles = await db.select({ title: tasks.title }).from(tasks)
      expect(titles.every(({ title }) => title.startsWith('Valid'))).toBe(true)
    })
  })
})
