import {
  type DecomposeItem,
  type DecomposeProposal,
  DecomposeProposalSchema,
  type TaskPriority,
  type TaskStatus,
} from '@devlog/shared'

import { formatIssue } from '../runtime/format-issue.js'
import type { SubmitResult } from '../runtime/submit-result.js'
import type { DecomposeMode } from './decompose-mode.js'

const DEFAULT_SUBTASK_STATUS: TaskStatus = 'todo'

type SubtasksProposalInput = {
  items: {
    title: string
    description?: string
    priority?: TaskPriority
    status?: TaskStatus
  }[]
  assumptions: string[]
}

type ProposalContext = {
  taskPriority: TaskPriority
  existingSubtaskTitles: readonly string[]
  mode: DecomposeMode
}

const normalizeTitle = (title: string): string => title.trim().replace(/\s+/g, ' ').toLowerCase()

const withDefaults = (
  input: SubtasksProposalInput,
  taskPriority: TaskPriority,
): Record<keyof DecomposeProposal, unknown> => ({
  items: input.items.map((item) => ({
    title: item.title,
    description: item.description,
    priority: item.priority ?? taskPriority,
    status: item.status ?? DEFAULT_SUBTASK_STATUS,
  })),
  assumptions: input.assumptions,
})

const duplicateTitleErrors = (items: readonly DecomposeItem[]): string[] => {
  const seenTitles = new Set<string>()
  const duplicateTitles = new Set<string>()
  for (const { title } of items) {
    const normalizedTitle = normalizeTitle(title)
    if (seenTitles.has(normalizedTitle)) duplicateTitles.add(title)
    seenTitles.add(normalizedTitle)
  }
  return [...duplicateTitles].map((title) => `Title "${title}" is used more than once`)
}

const existingSubtaskErrors = (
  items: readonly DecomposeItem[],
  existingSubtaskTitles: readonly string[],
): string[] => {
  const existingTitles = new Set(existingSubtaskTitles.map(normalizeTitle))
  return items
    .filter(({ title }) => existingTitles.has(normalizeTitle(title)))
    .map(({ title }) => `Title "${title}" is already a subtask of this task`)
}

const assumptionErrors = (proposal: DecomposeProposal, mode: DecomposeMode): string[] =>
  mode === 'skip-questions' && proposal.assumptions.length === 0
    ? ['The user asked for no questions: list at least one assumption you made']
    : []

const validateSubtasksProposal = (
  input: SubtasksProposalInput,
  context: ProposalContext,
): SubmitResult<DecomposeProposal> => {
  const parsed = DecomposeProposalSchema.safeParse(withDefaults(input, context.taskPriority))
  if (!parsed.success) return { accepted: false, errors: parsed.error.issues.map(formatIssue) }

  const proposal = parsed.data
  const errors = [
    ...duplicateTitleErrors(proposal.items),
    ...existingSubtaskErrors(proposal.items, context.existingSubtaskTitles),
    ...assumptionErrors(proposal, context.mode),
  ]

  return errors.length === 0 ? { accepted: true, value: proposal } : { accepted: false, errors }
}

export { DEFAULT_SUBTASK_STATUS, validateSubtasksProposal }
export type { ProposalContext, SubtasksProposalInput }
