import { tool } from 'ai'
import { z } from 'zod'

import {
  type PrioritizePlan,
  TaskIdSchema,
  TaskPrioritySchema,
  type TaskDetail,
  type TaskView,
} from '@devlog/shared'

import type { TasksReader } from '../../tasks/tasks.reader.js'
import type { SubmitResult } from '../runtime/submit-result.js'
import { daysSince } from './task-age.js'
import { validatePrioritizePlan } from './validate-prioritize-plan.js'

const LIST_TASKS_LIMIT = 50
const OPEN_TASKS_SNAPSHOT_LIMIT = 500
const SUBMIT_PLAN_TOOL = 'submit_plan'
const PRIORITIZE_TOOL_NAMES = ['list_tasks', 'get_task', SUBMIT_PLAN_TOOL] as const

type CompactTaskRow = {
  id: number
  title: string
  status: TaskView['status']
  priority: TaskView['priority']
  parentId: number | null
  ageDays: number
  staleDays: number
  openSubtasks: number
}

type ListTasksOutput = { tasks: CompactTaskRow[]; hasMore: boolean }

type TaskDetailOutput = CompactTaskRow & {
  description: string
  parent: TaskDetail['parent']
  subtasks: CompactTaskRow[]
}

type ToolError = { error: string }

const ListTasksInputSchema = z.object({
  status: z.enum(['todo', 'in-progress']).optional().describe('Only tasks with this status'),
  priority: TaskPrioritySchema.optional().describe('Only tasks with this priority'),
})

const GetTaskInputSchema = z.object({ id: TaskIdSchema.describe('Task id from list_tasks') })

const SubmitPlanInputSchema = z.object({
  focus: z
    .array(
      z.object({
        taskId: z.int().describe('Task id from list_tasks'),
        reason: z.string().describe('Why this task is in focus, at most 200 characters'),
      }),
    )
    .describe('3 to 5 tasks to work on now, most important first'),
  later: z.array(z.int()).describe('Ids of open tasks that can wait'),
  summary: z.string().describe('One or two sentences about the plan, at most 400 characters'),
})

const toCompactRow = (task: TaskView, now: Date): CompactTaskRow => ({
  id: task.id,
  title: task.title,
  status: task.status,
  priority: task.priority,
  parentId: task.parentId,
  ageDays: daysSince(task.createdAt, now),
  staleDays: daysSince(task.updatedAt, now),
  openSubtasks: task.subtaskCount - task.subtaskDoneCount,
})

const toTaskDetailOutput = (task: TaskDetail, now: Date): TaskDetailOutput => ({
  ...toCompactRow(task, now),
  description: task.description,
  parent: task.parent,
  subtasks: task.subtasks.map((subtask) => toCompactRow(subtask, now)),
})

const createPrioritizeTools = (tasksReader: TasksReader, now: Date) => ({
  list_tasks: tool({
    description:
      'List open (not done) tasks as compact rows, highest priority first. Optional filters by status and priority.',
    inputSchema: ListTasksInputSchema,
    execute: async (filter): Promise<ListTasksOutput> => {
      const tasks = await tasksReader.listOpen(filter, LIST_TASKS_LIMIT + 1)
      return {
        tasks: tasks.slice(0, LIST_TASKS_LIMIT).map((task) => toCompactRow(task, now)),
        hasMore: tasks.length > LIST_TASKS_LIMIT,
      }
    },
  }),
  get_task: tool({
    description: 'Read one task with its description, parent and subtasks.',
    inputSchema: GetTaskInputSchema,
    execute: async ({ id }): Promise<TaskDetailOutput | ToolError> => {
      const task = await tasksReader.findDetail(id)
      return task ? toTaskDetailOutput(task, now) : { error: `Task ${id} not found` }
    },
  }),
  [SUBMIT_PLAN_TOOL]: tool({
    description:
      'Submit the final plan. Answers accepted: true, or accepted: false with errors to fix before you submit again.',
    inputSchema: SubmitPlanInputSchema,
    execute: async (plan): Promise<SubmitResult<PrioritizePlan>> => {
      const openTasks = await tasksReader.listOpen({}, OPEN_TASKS_SNAPSHOT_LIMIT)
      return validatePrioritizePlan(plan, openTasks)
    },
  }),
})

export { createPrioritizeTools, OPEN_TASKS_SNAPSHOT_LIMIT, PRIORITIZE_TOOL_NAMES, SUBMIT_PLAN_TOOL }
