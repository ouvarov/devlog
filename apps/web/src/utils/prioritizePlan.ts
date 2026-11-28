import type { AgentMeta, AgentName, AgentsInfo, PlanFocusItem, TaskView } from '@devlog/shared'

import { ApiRequestError } from '@/api/client'
import { FALLBACK_REASON_MESSAGES } from '@/config/agentDisplay'
import type {
  PlanBanner,
  PlanTask,
  PlanTaskRef,
  PlanTaskRefs,
  ResolvedFocusItem,
  ResolvedLaterItem,
  TaskLookup,
} from '@/types/prioritizePlan'

const FALLBACK_PLAN_NOTE = 'The plan below comes from the formula: priority, age and status.'
const UNKNOWN_FALLBACK_MESSAGE = 'The model did not produce a plan.'
const NOT_FOUND_STATUS = 404
const LOADING_REF: PlanTaskRef = { kind: 'loading' }

const getPlanBanner = ({ stoppedBy, source, fallbackReason }: AgentMeta): PlanBanner | null => {
  if (stoppedBy === 'skipped') {
    return {
      kind: 'skipped',
      title: 'Nothing to prioritize',
      message: 'Every task is done. Add or reopen a task and run again.',
    }
  }
  if (source === 'fallback') {
    const reason = fallbackReason
      ? FALLBACK_REASON_MESSAGES[fallbackReason]
      : UNKNOWN_FALLBACK_MESSAGE
    return {
      kind: 'fallback',
      title: 'Computed without AI',
      message: `${reason} ${FALLBACK_PLAN_NOTE}`,
    }
  }
  return null
}

const toPlanTask = ({ id, title, status, priority }: TaskView): PlanTask => ({
  id,
  title,
  status,
  priority,
})

const getUnlistedIds = (
  taskIds: readonly number[],
  listedTasks: readonly TaskView[] | undefined,
  hasListFailed: boolean,
): number[] => {
  if (listedTasks) {
    const listedIds = new Set(listedTasks.map(({ id }) => id))
    return taskIds.filter((id) => !listedIds.has(id))
  }
  return hasListFailed ? [...taskIds] : []
}

const isNotFound = (error: Error): boolean =>
  error instanceof ApiRequestError && error.status === NOT_FOUND_STATUS

const toPlanTaskRef = (lookup: TaskLookup | undefined): PlanTaskRef => {
  if (!lookup) return LOADING_REF
  if (lookup.data) return { kind: 'found', task: toPlanTask(lookup.data) }
  if (lookup.isPending) return LOADING_REF
  if (lookup.error && isNotFound(lookup.error)) return { kind: 'missing' }
  return { kind: 'failed' }
}

const getPlanTaskRefs = (
  taskIds: readonly number[],
  listedTasks: readonly TaskView[] | undefined,
  lookups: ReadonlyMap<number, TaskLookup>,
): PlanTaskRefs => {
  const listed = new Map(listedTasks?.map((task) => [task.id, task]))
  return new Map(
    taskIds.map((id) => {
      const listedTask = listed.get(id)
      const taskRef: PlanTaskRef = listedTask
        ? { kind: 'found', task: toPlanTask(listedTask) }
        : toPlanTaskRef(lookups.get(id))
      return [id, taskRef]
    }),
  )
}

const resolveFocus = (focus: readonly PlanFocusItem[], refs: PlanTaskRefs): ResolvedFocusItem[] =>
  focus.map(({ taskId, reason }) => ({ taskId, reason, taskRef: refs.get(taskId) ?? LOADING_REF }))

const resolveLater = (later: readonly number[], refs: PlanTaskRefs): ResolvedLaterItem[] =>
  later.map((taskId) => ({ taskId, taskRef: refs.get(taskId) ?? LOADING_REF }))

const getMaxSteps = (info: AgentsInfo | undefined, name: AgentName): number | null =>
  info?.agents.find((agent) => agent.name === name)?.maxSteps ?? null

export { getMaxSteps, getPlanBanner, getPlanTaskRefs, getUnlistedIds, resolveFocus, resolveLater }
