import {
  type BatchTasks,
  type BatchTasksResult,
  BatchTasksResultSchema,
  type CreateTask,
  type TaskDetail,
  TaskDetailSchema,
  TaskListResponseSchema,
  type TaskView,
  TaskViewSchema,
  type UpdateTask,
} from '@devlog/shared'

import type { TaskListFilters } from '@/types/taskListFilters'

import { jsonBody, requestEmpty, requestJson } from './client'

type TaskChanges = {
  id: number
  changes: UpdateTask
}

const toListQuery = ({ status, sort }: TaskListFilters): string => {
  const params = new URLSearchParams({ sort })
  if (status) params.set('status', status)
  return params.toString()
}

const listTasks = async (filters: TaskListFilters, signal?: AbortSignal): Promise<TaskView[]> => {
  const { items } = await requestJson(`/tasks?${toListQuery(filters)}`, TaskListResponseSchema, {
    signal,
  })
  return items
}

const getTask = (id: number, signal?: AbortSignal): Promise<TaskDetail> =>
  requestJson(`/tasks/${id}`, TaskDetailSchema, { signal })

const createTask = (input: CreateTask): Promise<TaskView> =>
  requestJson('/tasks', TaskViewSchema, { method: 'POST', ...jsonBody(input) })

const createTasksBatch = (batch: BatchTasks): Promise<BatchTasksResult> =>
  requestJson('/tasks/batch', BatchTasksResultSchema, { method: 'POST', ...jsonBody(batch) })

const updateTask = ({ id, changes }: TaskChanges): Promise<TaskView> =>
  requestJson(`/tasks/${id}`, TaskViewSchema, { method: 'PATCH', ...jsonBody(changes) })

const deleteTask = (id: number): Promise<void> => requestEmpty(`/tasks/${id}`, { method: 'DELETE' })

export { createTask, createTasksBatch, deleteTask, getTask, listTasks, updateTask }
export type { TaskChanges }
