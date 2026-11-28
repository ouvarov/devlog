import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import {
  type DecomposeClarify,
  type DecomposeProposal,
  type TaskDetail,
  TaskPrioritySchema,
  TaskStatusSchema,
  type TaskView,
} from '@devlog/shared'

import type { TasksReader } from '../../tasks/tasks.reader.js'
import type { SubmitResult } from '../runtime/submit-result.js'
import type { DecomposeMode } from './decompose-mode.js'
import { SEARCH_WORD_MIN_LENGTH, searchWordsOf } from './search-words.js'
import { validateClarifyQuestions } from './validate-clarify-questions.js'
import { validateSubtasksProposal } from './validate-subtasks-proposal.js'

const SEARCH_TASKS_TOOL = 'search_tasks'
const ASK_CLARIFICATION_TOOL = 'ask_clarification'
const SUBMIT_SUBTASKS_TOOL = 'submit_subtasks'
const DECOMPOSE_TOOL_NAMES = [
  SEARCH_TASKS_TOOL,
  ASK_CLARIFICATION_TOOL,
  SUBMIT_SUBTASKS_TOOL,
] as const
const SEARCH_RESULT_LIMIT = 10

type SearchRow = Pick<TaskView, 'id' | 'title' | 'status' | 'priority' | 'parentId'>

type SearchTasksOutput = { tasks: SearchRow[] }

type ToolError = { error: string }

const SearchTasksInputSchema = z.object({
  query: z.string().describe('Words to look for in task titles and descriptions'),
})

const AskClarificationInputSchema = z.object({
  questions: z
    .array(z.string())
    .describe('1 to 3 short questions for the user, at most 300 characters each'),
})

const SubmitSubtasksInputSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().describe('Short concrete title, at most 200 characters'),
        description: z.string().optional().describe('What done means for this subtask'),
        priority: TaskPrioritySchema.optional().describe('Defaults to the priority of the task'),
        status: TaskStatusSchema.optional().describe(
          'todo, unless the user said this work has started or is finished',
        ),
      }),
    )
    .describe('3 to 8 subtasks, in the order they should be done'),
  assumptions: z
    .array(z.string())
    .describe('0 to 5 assumptions you made, at most 300 characters each'),
})

const toSearchRow = (task: TaskView): SearchRow => ({
  id: task.id,
  title: task.title,
  status: task.status,
  priority: task.priority,
  parentId: task.parentId,
})

const terminalToolNamesFor = (mode: DecomposeMode): string[] =>
  mode === 'may-ask' ? [SUBMIT_SUBTASKS_TOOL, ASK_CLARIFICATION_TOOL] : [SUBMIT_SUBTASKS_TOOL]

const createDecomposeTools = (
  tasksReader: TasksReader,
  task: TaskDetail,
  mode: DecomposeMode,
): ToolSet => {
  const searchTasks = tool({
    description:
      'Find existing tasks whose title or description contains any of the words, to avoid duplicating them.',
    inputSchema: SearchTasksInputSchema,
    execute: async ({ query }): Promise<SearchTasksOutput | ToolError> => {
      const words = searchWordsOf(query)
      if (words.length === 0) {
        return { error: `Use words of at least ${SEARCH_WORD_MIN_LENGTH} characters` }
      }
      const found = await tasksReader.searchByWords(words, SEARCH_RESULT_LIMIT)
      return { tasks: found.map(toSearchRow) }
    },
  })

  const askClarification = tool({
    description:
      'Ask the user 1 to 3 questions when the task is too vague to split. Answers accepted: true, or accepted: false with errors to fix.',
    inputSchema: AskClarificationInputSchema,
    execute: (input): SubmitResult<DecomposeClarify> => validateClarifyQuestions(input),
  })

  const submitSubtasks = tool({
    description:
      'Submit the proposed subtasks. Answers accepted: true, or accepted: false with errors to fix before you submit again.',
    inputSchema: SubmitSubtasksInputSchema,
    execute: (proposal): SubmitResult<DecomposeProposal> =>
      validateSubtasksProposal(proposal, {
        taskPriority: task.priority,
        existingSubtaskTitles: task.subtasks.map(({ title }) => title),
        mode,
      }),
  })

  return {
    [SEARCH_TASKS_TOOL]: searchTasks,
    ...(mode === 'may-ask' ? { [ASK_CLARIFICATION_TOOL]: askClarification } : {}),
    [SUBMIT_SUBTASKS_TOOL]: submitSubtasks,
  }
}

export {
  ASK_CLARIFICATION_TOOL,
  createDecomposeTools,
  DECOMPOSE_TOOL_NAMES,
  SEARCH_TASKS_TOOL,
  SUBMIT_SUBTASKS_TOOL,
  terminalToolNamesFor,
}
