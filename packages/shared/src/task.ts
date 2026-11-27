import { z } from 'zod'

const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const
const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
const TASK_SORT_FIELDS = ['createdAt', 'priority'] as const
const SORT_ORDERS = ['asc', 'desc'] as const

const TASK_TITLE_MAX_LENGTH = 200
const TASK_DESCRIPTION_MAX_LENGTH = 5000
const MAX_BATCH_OPERATIONS = 20

const hasNoIssues = (payload: z.core.ParsePayload): boolean => payload.issues.length === 0

const TaskStatusSchema = z.enum(TASK_STATUSES)
const TaskPrioritySchema = z.enum(TASK_PRIORITIES)

const TaskIdSchema = z.int32().positive()
const TaskTitleSchema = z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH)
const TaskDescriptionSchema = z.string().max(TASK_DESCRIPTION_MAX_LENGTH)

const TaskViewSchema = z
  .object({
    id: TaskIdSchema,
    title: z.string(),
    description: z.string(),
    status: TaskStatusSchema,
    priority: TaskPrioritySchema,
    parentId: TaskIdSchema.nullable(),
    subtaskCount: z.int().nonnegative(),
    subtaskDoneCount: z.int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict()

const TaskParentSchema = z.object({ id: TaskIdSchema, title: z.string() }).strict()

const TaskDetailSchema = TaskViewSchema.extend({
  subtasks: z.array(TaskViewSchema),
  parent: TaskParentSchema.nullable(),
}).strict()

const TaskListResponseSchema = z.object({ items: z.array(TaskViewSchema) }).strict()

const CreateTaskSchema = z
  .object({
    title: TaskTitleSchema,
    description: TaskDescriptionSchema.optional(),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    parentId: TaskIdSchema.optional(),
  })
  .strict()

const UpdateTaskSchema = z
  .object({
    title: TaskTitleSchema.optional(),
    description: TaskDescriptionSchema.optional(),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'At least one field must be changed',
    when: hasNoIssues,
  })

const ListTasksQuerySchema = z
  .object({
    status: TaskStatusSchema.optional(),
    sort: z.enum(TASK_SORT_FIELDS).default('createdAt'),
    order: z.enum(SORT_ORDERS).default('desc'),
  })
  .strict()

const BatchTaskUpdateSchema = z.object({ id: TaskIdSchema, changes: UpdateTaskSchema }).strict()

const BatchTasksSchema = z
  .object({
    create: z.array(CreateTaskSchema),
    update: z.array(BatchTaskUpdateSchema),
  })
  .strict()
  .refine(
    (batch) => {
      const operationCount = batch.create.length + batch.update.length
      return operationCount >= 1 && operationCount <= MAX_BATCH_OPERATIONS
    },
    { message: `A batch must have 1 to ${MAX_BATCH_OPERATIONS} operations`, when: hasNoIssues },
  )

const BatchTasksResultSchema = z
  .object({ created: z.array(TaskViewSchema), updated: z.array(TaskViewSchema) })
  .strict()

type TaskStatus = z.infer<typeof TaskStatusSchema>
type TaskPriority = z.infer<typeof TaskPrioritySchema>
type TaskSortField = (typeof TASK_SORT_FIELDS)[number]
type SortOrder = (typeof SORT_ORDERS)[number]
type TaskView = z.infer<typeof TaskViewSchema>
type TaskParent = z.infer<typeof TaskParentSchema>
type TaskDetail = z.infer<typeof TaskDetailSchema>
type TaskListResponse = z.infer<typeof TaskListResponseSchema>
type CreateTask = z.infer<typeof CreateTaskSchema>
type UpdateTask = z.infer<typeof UpdateTaskSchema>
type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>
type ListTasksQueryInput = z.input<typeof ListTasksQuerySchema>
type BatchTaskUpdate = z.infer<typeof BatchTaskUpdateSchema>
type BatchTasks = z.infer<typeof BatchTasksSchema>
type BatchTasksResult = z.infer<typeof BatchTasksResultSchema>

export {
  BatchTasksResultSchema,
  BatchTasksSchema,
  BatchTaskUpdateSchema,
  CreateTaskSchema,
  ListTasksQuerySchema,
  MAX_BATCH_OPERATIONS,
  SORT_ORDERS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_SORT_FIELDS,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
  TaskDetailSchema,
  TaskIdSchema,
  TaskListResponseSchema,
  TaskParentSchema,
  TaskPrioritySchema,
  TaskStatusSchema,
  TaskViewSchema,
  UpdateTaskSchema,
}
export type {
  BatchTasks,
  BatchTasksResult,
  BatchTaskUpdate,
  CreateTask,
  ListTasksQuery,
  ListTasksQueryInput,
  SortOrder,
  TaskDetail,
  TaskListResponse,
  TaskParent,
  TaskPriority,
  TaskSortField,
  TaskStatus,
  TaskView,
  UpdateTask,
}
