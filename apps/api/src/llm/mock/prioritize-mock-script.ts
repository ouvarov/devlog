import { z } from 'zod'

import {
  type MockCallOptions,
  type MockGenerateResult,
  type MockScript,
  toolCallStep,
  toolOutputsIn,
} from './scripted-model.js'

const MOCK_FOCUS_SIZE = 3
const MOCK_LATER_SIZE = 5

const ListedTasksSchema = z.object({
  tasks: z.array(z.object({ id: z.int(), status: z.string(), priority: z.string() })),
})

type ListedTask = z.infer<typeof ListedTasksSchema>['tasks'][number]

const listedTasksIn = (options: MockCallOptions): ListedTask[] => {
  const latestOutput = toolOutputsIn(options.prompt, 'list_tasks').at(-1)
  const listed = ListedTasksSchema.safeParse(latestOutput)
  return listed.success ? listed.data.tasks : []
}

const inspectFirstInProgressTask = (options: MockCallOptions): MockGenerateResult => {
  const tasks = listedTasksIn(options)
  const target = tasks.find(({ status }) => status === 'in-progress') ?? tasks[0]
  if (!target) return toolCallStep('list_tasks', {}, 'list_tasks-again')

  return toolCallStep('get_task', { id: target.id })
}

const submitListedOrder = (options: MockCallOptions): MockGenerateResult => {
  const tasks = listedTasksIn(options)
  const focus = tasks.slice(0, MOCK_FOCUS_SIZE).map((task) => ({
    taskId: task.id,
    reason: `Mock reason: ${task.status}, ${task.priority} priority.`,
  }))
  const later = tasks.slice(MOCK_FOCUS_SIZE, MOCK_FOCUS_SIZE + MOCK_LATER_SIZE).map(({ id }) => id)

  return toolCallStep('submit_plan', {
    focus,
    later,
    summary: 'Mock plan: the first tasks from list_tasks, no real model was called.',
  })
}

const PRIORITIZE_MOCK_SCRIPT: MockScript = [
  toolCallStep('list_tasks', {}),
  inspectFirstInProgressTask,
  submitListedOrder,
]

export { listedTasksIn, PRIORITIZE_MOCK_SCRIPT, submitListedOrder }
