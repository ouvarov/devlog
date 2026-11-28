import { z } from 'zod'

import {
  type MockCallOptions,
  type MockGenerateResult,
  type MockPrompt,
  type MockScript,
  toolCallStep,
} from './scripted-model.js'

const MOCK_TITLE_MAX_LENGTH = 60
const MOCK_SUBTASK_COUNT = 3
const FALLBACK_TASK_TITLE = 'the task'

const PromptContextSchema = z.object({
  task: z.object({ title: z.string() }),
  existingSubtasks: z.array(z.object({ title: z.string() })),
})

type PromptContext = z.infer<typeof PromptContextSchema>

const parseJsonLine = (line: string): unknown => {
  if (!line.startsWith('{')) return undefined
  try {
    return JSON.parse(line)
  } catch {
    return undefined
  }
}

const promptLinesOf = (prompt: MockPrompt): string[] =>
  prompt.flatMap((message) => {
    if (message.role !== 'user') return []
    return message.content.flatMap((part) => (part.type === 'text' ? part.text.split('\n') : []))
  })

const promptContextIn = (options: MockCallOptions): PromptContext => {
  for (const line of promptLinesOf(options.prompt)) {
    const context = PromptContextSchema.safeParse(parseJsonLine(line))
    if (context.success) return context.data
  }
  return { task: { title: FALLBACK_TASK_TITLE }, existingSubtasks: [] }
}

const shortTitleOf = (context: PromptContext): string =>
  context.task.title.trim().slice(0, MOCK_TITLE_MAX_LENGTH)

const normalizeTitle = (title: string): string => title.trim().replace(/\s+/g, ' ').toLowerCase()

const freeSubtaskTitles = (context: PromptContext): string[] => {
  const takenTitles = new Set(context.existingSubtasks.map(({ title }) => normalizeTitle(title)))
  const shortTitle = shortTitleOf(context)
  const titles: string[] = []
  for (let part = 1; titles.length < MOCK_SUBTASK_COUNT; part += 1) {
    const title = `Mock part ${part}: ${shortTitle}`
    if (!takenTitles.has(normalizeTitle(title))) titles.push(title)
  }
  return titles
}

const searchTaskTitle = (options: MockCallOptions): MockGenerateResult =>
  toolCallStep('search_tasks', { query: shortTitleOf(promptContextIn(options)) })

const askAboutTaskTitle = (options: MockCallOptions): MockGenerateResult =>
  toolCallStep('ask_clarification', {
    questions: [
      `What should be true when "${shortTitleOf(promptContextIn(options))}" is done?`,
      'Which part matters most to start with?',
    ],
  })

const submitPartsOfTaskTitle = (options: MockCallOptions): MockGenerateResult =>
  toolCallStep('submit_subtasks', {
    items: freeSubtaskTitles(promptContextIn(options)).map((title) => ({
      title,
      description: 'Mock subtask: no real model was called.',
      status: 'todo',
    })),
    assumptions: ['Mock assumption: the subtasks repeat the task title, no real model was called.'],
  })

const DECOMPOSE_CLARIFY_MOCK_SCRIPT: MockScript = [searchTaskTitle, askAboutTaskTitle]
const DECOMPOSE_PROPOSAL_MOCK_SCRIPT: MockScript = [searchTaskTitle, submitPartsOfTaskTitle]

export {
  DECOMPOSE_CLARIFY_MOCK_SCRIPT,
  DECOMPOSE_PROPOSAL_MOCK_SCRIPT,
  promptContextIn,
  submitPartsOfTaskTitle,
}
