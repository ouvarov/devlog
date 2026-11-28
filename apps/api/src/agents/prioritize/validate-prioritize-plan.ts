import {
  PLAN_FOCUS_MAX_SIZE,
  PLAN_FOCUS_MIN_SIZE,
  type PrioritizePlan,
  PrioritizePlanSchema,
  type TaskView,
} from '@devlog/shared'

import { formatIssue } from '../runtime/format-issue.js'
import type { SubmitResult } from '../runtime/submit-result.js'

const focusSizeErrors = (focusSize: number, openTaskCount: number): string[] => {
  const minFocusSize = Math.min(PLAN_FOCUS_MIN_SIZE, openTaskCount)
  if (focusSize >= minFocusSize && focusSize <= PLAN_FOCUS_MAX_SIZE) return []

  if (openTaskCount < PLAN_FOCUS_MIN_SIZE) {
    return [`focus must list all ${openTaskCount} open tasks`]
  }
  return [
    `focus must have ${PLAN_FOCUS_MIN_SIZE} to ${PLAN_FOCUS_MAX_SIZE} tasks, got ${focusSize}`,
  ]
}

const plannedIdsOf = (plan: PrioritizePlan): number[] => [
  ...plan.focus.map(({ taskId }) => taskId),
  ...plan.later,
]

const unknownIdErrors = (plannedIds: number[], openTaskIds: ReadonlySet<number>): string[] =>
  [...new Set(plannedIds)]
    .filter((id) => !openTaskIds.has(id))
    .map((id) => `Task ${id} does not exist or is done`)

const duplicateIdErrors = (plannedIds: number[]): string[] => {
  const seenIds = new Set<number>()
  const duplicateIds = new Set<number>()
  for (const id of plannedIds) {
    if (seenIds.has(id)) duplicateIds.add(id)
    seenIds.add(id)
  }
  return [...duplicateIds].map((id) => `Task ${id} is listed more than once`)
}

const validatePrioritizePlan = (
  input: unknown,
  openTasks: readonly TaskView[],
): SubmitResult<PrioritizePlan> => {
  const parsed = PrioritizePlanSchema.safeParse(input)
  if (!parsed.success) return { accepted: false, errors: parsed.error.issues.map(formatIssue) }

  const plan = parsed.data
  const plannedIds = plannedIdsOf(plan)
  const openTaskIds = new Set(openTasks.map(({ id }) => id))
  const errors = [
    ...focusSizeErrors(plan.focus.length, openTasks.length),
    ...unknownIdErrors(plannedIds, openTaskIds),
    ...duplicateIdErrors(plannedIds),
  ]

  return errors.length === 0 ? { accepted: true, value: plan } : { accepted: false, errors }
}

export { validatePrioritizePlan }
