import type { AgentMeta, AgentsInfo, AgentName, PlanFocusItem, TaskView } from '@devlog/shared'

import { FALLBACK_REASON_MESSAGES } from '@/config/agentDisplay'
import type {
  KnownTasks,
  PlanBanner,
  ResolvedFocusItem,
  ResolvedLaterItem,
} from '@/types/prioritizePlan'

const FALLBACK_PLAN_NOTE = 'The plan below comes from the formula: priority, age and status.'
const UNKNOWN_FALLBACK_MESSAGE = 'The model did not produce a plan.'

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
    return { kind: 'fallback', title: 'Computed without AI', message: `${reason} ${FALLBACK_PLAN_NOTE}` }
  }
  return null
}

const toKnownTasks = (tasks: readonly TaskView[]): KnownTasks =>
  new Map(tasks.map(({ id, title, status, priority }) => [id, { id, title, status, priority }]))

const resolveFocus = (focus: readonly PlanFocusItem[], known: KnownTasks): ResolvedFocusItem[] =>
  focus.map(({ taskId, reason }) => ({ taskId, reason, task: known.get(taskId) ?? null }))

const resolveLater = (later: readonly number[], known: KnownTasks): ResolvedLaterItem[] =>
  later.map((taskId) => ({ taskId, task: known.get(taskId) ?? null }))

const getMaxSteps = (info: AgentsInfo | undefined, name: AgentName): number | null =>
  info?.agents.find((agent) => agent.name === name)?.maxSteps ?? null

export { getMaxSteps, getPlanBanner, resolveFocus, resolveLater, toKnownTasks }
