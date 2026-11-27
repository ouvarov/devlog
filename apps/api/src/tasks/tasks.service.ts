import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import type {
  BatchTaskUpdate,
  BatchTasks,
  BatchTasksResult,
  CreateTask,
  ListTasksQuery,
  TaskDetail,
  TaskListResponse,
  TaskParent,
  TaskStatus,
  TaskView,
  UpdateTask,
} from '@devlog/shared'

import type { DatabaseExecutor } from '../db/database.js'
import {
  type NewTaskValues,
  type TaskCompletionChange,
  type TaskRecord,
  TasksRepository,
} from './tasks.repository.js'

const toTaskView = (task: TaskRecord): TaskView => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  parentId: task.parentId,
  subtaskCount: task.subtaskCount,
  subtaskDoneCount: task.subtaskDoneCount,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
  completedAt: task.completedAt?.toISOString() ?? null,
})

const toNewTaskValues = (input: CreateTask): NewTaskValues => ({
  title: input.title,
  description: input.description,
  status: input.status,
  priority: input.priority,
  parentId: input.parentId,
  isCompleted: input.status === 'done',
})

const completionChangeFor = (status: TaskStatus | undefined): TaskCompletionChange => {
  if (status === undefined) return 'unchanged'
  return status === 'done' ? 'complete' : 'reopen'
}

const uniqueParentIdsOf = (inputs: CreateTask[]): number[] => [
  ...new Set(inputs.flatMap(({ parentId }) => (parentId === undefined ? [] : [parentId]))),
]

const taskNotFound = (id: number): NotFoundException =>
  new NotFoundException(`Task ${id} not found`)

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async list(query: ListTasksQuery): Promise<TaskListResponse> {
    const tasks = await this.tasksRepository.findTopLevel(query)
    return { items: tasks.map(toTaskView) }
  }

  async findOne(id: number): Promise<TaskDetail> {
    const task = await this.tasksRepository.findById(id)
    if (!task) throw taskNotFound(id)

    const [subtasks, parent] = await Promise.all([
      this.tasksRepository.findSubtasks(id),
      this.findParent(task.parentId),
    ])
    return { ...toTaskView(task), subtasks: subtasks.map(toTaskView), parent }
  }

  create(input: CreateTask): Promise<TaskView> {
    return this.tasksRepository.transaction(async (tx) => {
      const [createdTask] = await this.createTasks([input], tx)
      return createdTask
    })
  }

  update(id: number, changes: UpdateTask): Promise<TaskView> {
    return this.tasksRepository.transaction(async (tx) => {
      const [updatedTask] = await this.updateTasks([{ id, changes }], tx)
      return updatedTask
    })
  }

  async remove(id: number): Promise<void> {
    const isDeleted = await this.tasksRepository.deleteById(id)
    if (!isDeleted) throw taskNotFound(id)
  }

  batch(batch: BatchTasks): Promise<BatchTasksResult> {
    return this.tasksRepository.transaction(async (tx) => {
      const created = await this.createTasks(batch.create, tx)
      const updated = await this.updateTasks(batch.update, tx)
      return { created, updated }
    })
  }

  private async findParent(parentId: number | null): Promise<TaskParent | null> {
    if (parentId === null) return null

    const parent = await this.tasksRepository.findById(parentId)
    return parent ? { id: parent.id, title: parent.title } : null
  }

  private async createTasks(inputs: CreateTask[], tx: DatabaseExecutor): Promise<TaskView[]> {
    if (inputs.length === 0) return []

    await this.assertParentsAcceptSubtasks(uniqueParentIdsOf(inputs), tx)
    const createdIds = await this.tasksRepository.insertMany(inputs.map(toNewTaskValues), tx)
    return this.findViewsInOrder(createdIds, tx)
  }

  private async updateTasks(updates: BatchTaskUpdate[], tx: DatabaseExecutor): Promise<TaskView[]> {
    for (const { id, changes } of updates) {
      const completion = completionChangeFor(changes.status)
      const isUpdated = await this.tasksRepository.update(id, { changes, completion }, tx)
      if (!isUpdated) throw taskNotFound(id)
    }
    return this.findViewsInOrder(
      updates.map(({ id }) => id),
      tx,
    )
  }

  private async assertParentsAcceptSubtasks(
    parentIds: number[],
    tx: DatabaseExecutor,
  ): Promise<void> {
    const parents = await this.tasksRepository.findParents(parentIds, tx)
    const parentsById = new Map(parents.map((parent) => [parent.id, parent]))

    for (const parentId of parentIds) {
      const parent = parentsById.get(parentId)
      if (!parent) throw new NotFoundException(`Parent task ${parentId} not found`)
      if (parent.parentId !== null) {
        throw new BadRequestException(`Task ${parentId} is a subtask and cannot have subtasks`)
      }
      if (parent.status === 'done') {
        throw new BadRequestException(`Task ${parentId} is done and cannot get new subtasks`)
      }
    }
  }

  private async findViewsInOrder(ids: number[], tx: DatabaseExecutor): Promise<TaskView[]> {
    const tasks = await this.tasksRepository.findByIds([...new Set(ids)], tx)
    const tasksById = new Map(tasks.map((task) => [task.id, task]))

    return ids.flatMap((id) => {
      const task = tasksById.get(id)
      return task ? [toTaskView(task)] : []
    })
  }
}
