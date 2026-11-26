import { z } from 'zod'

const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const
const TASK_PRIORITIES = ['low', 'medium', 'high'] as const

const TaskStatusSchema = z.enum(TASK_STATUSES)
const TaskPrioritySchema = z.enum(TASK_PRIORITIES)

type TaskStatus = z.infer<typeof TaskStatusSchema>
type TaskPriority = z.infer<typeof TaskPrioritySchema>

export { TASK_PRIORITIES, TASK_STATUSES, TaskPrioritySchema, TaskStatusSchema }
export type { TaskPriority, TaskStatus }
