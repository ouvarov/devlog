import type { PrioritizeResponse, TaskPriority, TaskStatus, TaskView } from '@devlog/shared'

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

type PlanTaskRef =
  { kind: 'found'; task: PlanTask } | { kind: 'loading' } | { kind: 'missing' } | { kind: 'failed' }

type UnresolvedPlanTaskKind = Exclude<PlanTaskRef['kind'], 'found'>

type PlanTaskRefs = ReadonlyMap<number, PlanTaskRef>

type TaskLookup = {
  data: TaskView | undefined
  isPending: boolean
  error: Error | null
}

type ResolvedFocusItem = {
  taskId: number
  reason: string
  taskRef: PlanTaskRef
}

type ResolvedLaterItem = {
  taskId: number
  taskRef: PlanTaskRef
}

type PlanBanner = {
  kind: 'skipped' | 'fallback'
  title: string
  message: string
}

export type {
  PlanBanner,
  PlanTask,
  PlanTaskRef,
  PlanTaskRefs,
  PrioritizeRun,
  ResolvedFocusItem,
  ResolvedLaterItem,
  TaskLookup,
  UnresolvedPlanTaskKind,
}
