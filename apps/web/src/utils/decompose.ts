import {
  type ApiErrorCode,
  type BatchTasks,
  BatchTasksSchema,
  type DecomposeRequest,
  DecomposeRequestSchema,
} from '@devlog/shared'

import { ApiRequestError } from '@/api/client'
import type {
  ClarifyErrors,
  DecomposeErrorView,
  ProposalErrors,
  ProposalItemDraft,
  ValidationResult,
} from '@/types/decompose'

import { GENERIC_SUBMIT_MESSAGE, type ValidationIssue, getIssueMessage } from './taskForm'

const NOT_RETRYABLE_CODES: readonly ApiErrorCode[] = [
  'LLM_NOT_CONFIGURED',
  'BAD_REQUEST',
  'NOT_FOUND',
  'VALIDATION_FAILED',
]

const ERROR_TITLES = {
  AGENT_FAILED: 'The agent did not propose valid subtasks',
  LLM_NOT_CONFIGURED: 'No LLM is configured',
} satisfies Partial<Record<ApiErrorCode, string>>

const DEFAULT_ERROR_TITLE = 'The agent could not run'

const toStartRequest = (taskId: number, isSkippingQuestions: boolean): DecomposeRequest =>
  isSkippingQuestions ? { taskId, skipClarification: true } : { taskId }

const toSkipRequest = (taskId: number): DecomposeRequest => ({ taskId, skipClarification: true })

const toClarifiedRequest = (
  taskId: number,
  questions: readonly string[],
  answers: readonly string[],
): ValidationResult<DecomposeRequest, ClarifyErrors> => {
  const parsed = DecomposeRequestSchema.safeParse({
    taskId,
    clarification: { questions, answers },
  })
  if (parsed.success) return { success: true, data: parsed.data }

  const errors: ClarifyErrors = { answers: {}, message: null }
  for (const issue of parsed.error.issues) {
    const [, field, index] = issue.path
    if (field === 'answers' && typeof index === 'number') {
      errors.answers[index] ??= getIssueMessage(issue)
    } else {
      errors.message ??= getIssueMessage(issue)
    }
  }
  return { success: false, errors }
}

const getIncludedItems = (items: readonly ProposalItemDraft[]): ProposalItemDraft[] =>
  items.filter(({ isIncluded }) => isIncluded)

const toProposalErrors = (
  issues: readonly ValidationIssue[],
  includedItems: readonly ProposalItemDraft[],
): ProposalErrors => {
  const errors: ProposalErrors = { items: {}, message: null }
  const messages: string[] = []

  for (const issue of issues) {
    const [operation, index, ...fieldPath] = issue.path
    const item =
      operation === 'create' && typeof index === 'number' ? includedItems[index] : undefined
    const message = getIssueMessage({ ...issue, path: fieldPath })
    if (item) errors.items[item.key] ??= message
    else messages.push(message)
  }

  return { ...errors, message: messages.length > 0 ? messages.join('. ') : null }
}

const toBatchInput = (
  parentId: number,
  items: readonly ProposalItemDraft[],
): ValidationResult<BatchTasks, ProposalErrors> => {
  const includedItems = getIncludedItems(items)
  const parsed = BatchTasksSchema.safeParse({
    create: includedItems.map(({ title, description, priority, status }) => ({
      title,
      description,
      priority,
      status,
      parentId,
    })),
    update: [],
  })
  if (parsed.success) return { success: true, data: parsed.data }
  return { success: false, errors: toProposalErrors(parsed.error.issues, includedItems) }
}

const getBatchErrors = (error: unknown, items: readonly ProposalItemDraft[]): ProposalErrors => {
  if (!(error instanceof ApiRequestError)) return { items: {}, message: GENERIC_SUBMIT_MESSAGE }
  if (error.issues && error.issues.length > 0) {
    return toProposalErrors(error.issues, getIncludedItems(items))
  }
  return { items: {}, message: error.message }
}

const getErrorTitle = (code: ApiErrorCode | null): string =>
  (code && code in ERROR_TITLES ? ERROR_TITLES[code as keyof typeof ERROR_TITLES] : undefined) ??
  DEFAULT_ERROR_TITLE

const getDecomposeErrorView = (error: unknown): DecomposeErrorView => {
  if (!(error instanceof ApiRequestError)) {
    return {
      title: DEFAULT_ERROR_TITLE,
      message: GENERIC_SUBMIT_MESSAGE,
      trace: [],
      canRetry: true,
    }
  }

  return {
    title: getErrorTitle(error.code),
    message: error.message,
    trace: error.trace ?? [],
    canRetry: error.code === null || !NOT_RETRYABLE_CODES.includes(error.code),
  }
}

export {
  getBatchErrors,
  getDecomposeErrorView,
  getIncludedItems,
  toBatchInput,
  toClarifiedRequest,
  toSkipRequest,
  toStartRequest,
}
