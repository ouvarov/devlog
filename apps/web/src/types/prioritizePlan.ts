import type { PrioritizeResponse, TaskPriority, TaskStatus } from '@devlog/shared'

type PrioritizeRun = {
  response: PrioritizeResponse
  finishedAt: string
}

type PlanTask = {
  id: number
  title: string
  status: TaskStatus
  priority: TaskPriority
}

type KnownTasks = ReadonlyMap<number, PlanTask>

type ResolvedFocusItem = {
  taskId: number
  reason: string
  task: PlanTask | null
}

type ResolvedLaterItem = {
  taskId: number
  task: PlanTask | null
}

type PlanBanner = {
  kind: 'skipped' | 'fallback'
  title: string
  message: string
}

export type {
  KnownTasks,
  PlanBanner,
  PlanTask,
  PrioritizeRun,
  ResolvedFocusItem,
  ResolvedLaterItem,
}
