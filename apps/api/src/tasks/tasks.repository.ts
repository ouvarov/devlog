import { Inject, Injectable } from '@nestjs/common'
import {
  type SQL,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import {
  type ListTasksQuery,
  TASK_PRIORITIES,
  type TaskPriority,
  type TaskStatus,
  type UpdateTask,
} from '@devlog/shared'

import type { Database, DatabaseExecutor } from '../db/database.js'
import { DRIZZLE } from '../db/db.tokens.js'
import { tasks } from '../db/schema/index.js'
import { toContainsPattern } from './like-pattern.js'

const MAX_LIST_SIZE = 500
const DONE_STATUS: TaskStatus = 'done'

type TaskRecord = {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  parentId: number | null
  subtaskCount: number
  subtaskDoneCount: number
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

type TaskParentRecord = {
  id: number
  parentId: number | null
  status: TaskStatus
}

type NewTaskValues = {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  parentId?: number
  isCompleted: boolean
}

type OpenTasksFilter = {
  status?: Exclude<TaskStatus, 'done'>
  priority?: TaskPriority
}

type TaskCompletionChange = 'complete' | 'reopen' | 'unchanged'

type TaskUpdateValues = {
  changes: UpdateTask
  completion: TaskCompletionChange
}

const subtasks = alias(tasks, 'subtasks')

const priorityRank = sql`case ${tasks.priority} ${sql.join(
  TASK_PRIORITIES.map((priority, rank) => sql`when ${priority} then ${sql.raw(String(rank))}`),
  sql` `,
)} end`

const orderByFor = ({ sort, order }: Pick<ListTasksQuery, 'sort' | 'order'>): SQL[] => {
  const direction = order === 'asc' ? asc : desc
  if (sort === 'priority') return [direction(priorityRank), desc(tasks.createdAt), desc(tasks.id)]

  return [direction(tasks.createdAt), direction(tasks.id)]
}

const matchesAnyWord = (words: string[]): SQL | undefined =>
  or(
    ...words.map((word) => {
      const pattern = toContainsPattern(word)
      return or(ilike(tasks.title, pattern), ilike(tasks.description, pattern))
    }),
  )

const completedAtFor = (completion: TaskCompletionChange): SQL | null | undefined => {
  if (completion === 'complete') return sql`coalesce(${tasks.completedAt}, now())`
  if (completion === 'reopen') return null
  return undefined
}

@Injectable()
export class TasksRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  transaction<T>(work: (tx: DatabaseExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction(work)
  }

  findTopLevel(query: ListTasksQuery): Promise<TaskRecord[]> {
    const statusFilter = query.status ? eq(tasks.status, query.status) : undefined

    return this.selectTaskRecords(this.db)
      .where(and(isNull(tasks.parentId), statusFilter))
      .orderBy(...orderByFor(query))
      .limit(MAX_LIST_SIZE)
  }

  findOpen(filter: OpenTasksFilter, limit: number): Promise<TaskRecord[]> {
    return this.selectTaskRecords(this.db)
      .where(
        and(
          ne(tasks.status, DONE_STATUS),
          filter.status ? eq(tasks.status, filter.status) : undefined,
          filter.priority ? eq(tasks.priority, filter.priority) : undefined,
        ),
      )
      .orderBy(desc(priorityRank), asc(tasks.createdAt), asc(tasks.id))
      .limit(limit)
  }

  findMatchingAnyWord(words: string[], limit: number): Promise<TaskRecord[]> {
    if (words.length === 0) return Promise.resolve([])

    return this.selectTaskRecords(this.db)
      .where(matchesAnyWord(words))
      .orderBy(desc(tasks.createdAt), desc(tasks.id))
      .limit(limit)
  }

  async findById(id: number): Promise<TaskRecord | null> {
    const [task] = await this.selectTaskRecords(this.db).where(eq(tasks.id, id))
    return task ?? null
  }

  findByIds(ids: number[], tx: DatabaseExecutor): Promise<TaskRecord[]> {
    if (ids.length === 0) return Promise.resolve([])
    return this.selectTaskRecords(tx).where(inArray(tasks.id, ids))
  }

  findSubtasks(parentId: number): Promise<TaskRecord[]> {
    return this.selectTaskRecords(this.db)
      .where(eq(tasks.parentId, parentId))
      .orderBy(asc(tasks.createdAt), asc(tasks.id))
  }

  findParents(ids: number[], tx: DatabaseExecutor): Promise<TaskParentRecord[]> {
    if (ids.length === 0) return Promise.resolve([])
    return tx
      .select({ id: tasks.id, parentId: tasks.parentId, status: tasks.status })
      .from(tasks)
      .where(inArray(tasks.id, ids))
  }

  async insertMany(newTasks: NewTaskValues[], tx: DatabaseExecutor): Promise<number[]> {
    if (newTasks.length === 0) return []

    const insertedTasks = await tx
      .insert(tasks)
      .values(
        newTasks.map((newTask) => ({
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          parentId: newTask.parentId,
          completedAt: newTask.isCompleted ? sql`now()` : null,
        })),
      )
      .returning({ id: tasks.id })

    return insertedTasks.map(({ id }) => id)
  }

  async update(
    id: number,
    { changes, completion }: TaskUpdateValues,
    tx: DatabaseExecutor,
  ): Promise<boolean> {
    const updatedTasks = await tx
      .update(tasks)
      .set({
        title: changes.title,
        description: changes.description,
        status: changes.status,
        priority: changes.priority,
        completedAt: completedAtFor(completion),
        updatedAt: sql`now()`,
      })
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id })

    return updatedTasks.length > 0
  }

  async deleteById(id: number): Promise<boolean> {
    const deletedTasks = await this.db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id })
    return deletedTasks.length > 0
  }

  private selectTaskRecords(executor: DatabaseExecutor) {
    const subtaskCounts = executor
      .select({
        subtaskCount: count().as('subtask_count'),
        subtaskDoneCount: count(sql`case when ${subtasks.status} = ${DONE_STATUS} then 1 end`).as(
          'subtask_done_count',
        ),
      })
      .from(subtasks)
      .where(eq(subtasks.parentId, tasks.id))
      .as('subtask_counts')

    return executor
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        parentId: tasks.parentId,
        subtaskCount: subtaskCounts.subtaskCount,
        subtaskDoneCount: subtaskCounts.subtaskDoneCount,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .crossJoinLateral(subtaskCounts)
      .$dynamic()
  }
}

export type {
  NewTaskValues,
  OpenTasksFilter,
  TaskCompletionChange,
  TaskParentRecord,
  TaskRecord,
  TaskUpdateValues,
}
