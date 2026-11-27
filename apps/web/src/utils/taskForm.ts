import {
  type CreateTask,
  CreateTaskSchema,
  type UpdateTask,
  UpdateTaskSchema,
} from '@devlog/shared'

import { ApiRequestError } from '@/api/client'
import type {
  TaskFormErrors,
  TaskFormField,
  TaskFormResult,
  TaskFormValues,
} from '@/types/taskForm'

import { pickOption } from './options'

type ValidationIssue = {
  code?: string
  path: readonly PropertyKey[]
  message: string
  maximum?: unknown
}

const TASK_FORM_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
] as const satisfies readonly TaskFormField[]

const EMPTY_TASK_FORM: TaskFormValues = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
}

const GENERIC_SUBMIT_MESSAGE = 'Something went wrong. Try again.'

const getIssueMessage = (issue: ValidationIssue): string => {
  if (issue.code === 'too_small') return 'This field is required'
  if (issue.code === 'too_big') return `Must be at most ${String(issue.maximum)} characters`
  return issue.message
}

const toFormErrors = (issues: readonly ValidationIssue[]): TaskFormErrors => {
  const fields: TaskFormErrors['fields'] = {}
  const formMessages: string[] = []

  for (const issue of issues) {
    const field = pickOption(TASK_FORM_FIELDS, issue.path[0])
    if (field) fields[field] ??= getIssueMessage(issue)
    else formMessages.push(getIssueMessage(issue))
  }

  return { fields, message: formMessages.length > 0 ? formMessages.join('. ') : null }
}

const getSubmitErrors = (error: unknown): TaskFormErrors => {
  if (!(error instanceof ApiRequestError)) return { fields: {}, message: GENERIC_SUBMIT_MESSAGE }
  if (error.issues && error.issues.length > 0) return toFormErrors(error.issues)
  return { fields: {}, message: error.message }
}

const toCreateTaskInput = (
  values: TaskFormValues,
  parentId?: number,
): TaskFormResult<CreateTask> => {
  const parsed = CreateTaskSchema.safeParse({ ...values, parentId })
  if (parsed.success) return { success: true, data: parsed.data }
  return { success: false, errors: toFormErrors(parsed.error.issues) }
}

const toUpdateTaskChanges = (
  initialValues: TaskFormValues,
  values: TaskFormValues,
): TaskFormResult<UpdateTask> => {
  const changes = Object.fromEntries(
    TASK_FORM_FIELDS.filter((field) => values[field] !== initialValues[field]).map((field) => [
      field,
      values[field],
    ]),
  )
  const parsed = UpdateTaskSchema.safeParse(changes)
  if (parsed.success) return { success: true, data: parsed.data }
  return { success: false, errors: toFormErrors(parsed.error.issues) }
}

export {
  EMPTY_TASK_FORM,
  getSubmitErrors,
  TASK_FORM_FIELDS,
  toCreateTaskInput,
  toFormErrors,
  toUpdateTaskChanges,
}
