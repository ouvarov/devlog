import type { TaskPriority, TaskStatus } from '@devlog/shared'

type TaskFormValues = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

type TaskFormField = keyof TaskFormValues

type TaskFormErrors = {
  fields: Partial<Record<TaskFormField, string>>
  message: string | null
}

type TaskFormResult<T> = { success: true; data: T } | { success: false; errors: TaskFormErrors }

export type { TaskFormErrors, TaskFormField, TaskFormResult, TaskFormValues }
