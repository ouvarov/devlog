import type {
  AgentFallbackReason,
  PlanFocusItem,
  PrioritizePlan,
  TaskPriority,
  TaskStatus,
  TaskView,
} from '@devlog/shared'

import { daysSince } from './task-age.js'

const PRIORITY_WEIGHT: Readonly<Record<TaskPriority, number>> = { low: 1, medium: 2, high: 3 }
const MAX_COUNTED_AGE_DAYS = 14
const AGE_DAYS_PER_WEIGHT_STEP = 7
const IN_PROGRESS_BONUS = 2
const FALLBACK_FOCUS_SIZE = 5

const FALLBACK_REASON_TEXT: Readonly<Record<AgentFallbackReason, string>> = {
  'rate-limited': 'the model hit its rate limit',
  timeout: 'the model did not answer in time',
  'invalid-output': 'the model gave no valid plan',
  'llm-error': 'the model call failed',
}

type ScoreInput = {
  priority: TaskPriority
  status: TaskStatus
  ageDays: number
}

type ScoredTask = ScoreInput & { id: number; score: number }

const scoreTask = ({ priority, status, ageDays }: ScoreInput): number => {
  const countedAgeDays = Math.min(ageDays, MAX_COUNTED_AGE_DAYS)
  const ageFactor = 1 + countedAgeDays / AGE_DAYS_PER_WEIGHT_STEP
  const inProgressBonus = status === 'in-progress' ? IN_PROGRESS_BONUS : 0
  return PRIORITY_WEIGHT[priority] * ageFactor + inProgressBonus
}

const toScoredTask = (task: TaskView, now: Date): ScoredTask => {
  const ageDays = daysSince(task.createdAt, now)
  const scoreInput = { priority: task.priority, status: task.status, ageDays }
  return { id: task.id, ...scoreInput, score: scoreTask(scoreInput) }
}

const byScoreThenAge = (left: ScoredTask, right: ScoredTask): number =>
  right.score - left.score || right.ageDays - left.ageDays || left.id - right.id

const reasonFor = (task: ScoredTask): string => {
  const progress = task.status === 'in-progress' ? 'already in progress' : 'not started'
  return `${task.priority} priority, ${progress}, open ${task.ageDays} days (score ${task.score.toFixed(1)})`
}

const buildFallbackPlan = (
  openTasks: readonly TaskView[],
  fallbackReason: AgentFallbackReason,
  now: Date,
): PrioritizePlan => {
  const ranked = openTasks.map((task) => toScoredTask(task, now)).sort(byScoreThenAge)
  const focus: PlanFocusItem[] = ranked
    .slice(0, FALLBACK_FOCUS_SIZE)
    .map((task) => ({ taskId: task.id, reason: reasonFor(task) }))

  return {
    focus,
    later: ranked.slice(FALLBACK_FOCUS_SIZE).map(({ id }) => id),
    summary: `Ranked without AI by priority, age and status, because ${FALLBACK_REASON_TEXT[fallbackReason]}.`,
  }
}

export { buildFallbackPlan, scoreTask }
