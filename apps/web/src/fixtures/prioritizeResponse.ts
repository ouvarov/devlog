import type { AgentMeta, PrioritizeResponse } from '@devlog/shared'

const LLM_META: AgentMeta = {
  provider: 'mock',
  modelId: 'mock-prioritize',
  source: 'llm',
  stoppedBy: 'submitted',
  steps: 3,
  usage: { inputTokens: 1200, outputTokens: 300 },
  durationMs: 2400,
}

const PRIORITIZE_RESPONSE: PrioritizeResponse = {
  plan: {
    focus: [
      { taskId: 1, reason: 'In progress and high priority.' },
      { taskId: 2, reason: 'Flaky test blocks every pull request.' },
      { taskId: 3, reason: 'Old medium task, waiting for two weeks.' },
    ],
    later: [4, 5],
    summary: 'Finish the CI work first, then the flaky test.',
  },
  meta: LLM_META,
  trace: [
    {
      index: 0,
      toolCalls: [
        {
          toolName: 'list_tasks',
          input: {},
          output: '{"tasks":[{"id":1}]}',
          isError: false,
          isRejectedSubmit: false,
        },
      ],
      finishReason: 'tool-calls',
    },
    {
      index: 1,
      text: 'Submitting a plan with a done task.',
      toolCalls: [
        {
          toolName: 'submit_plan',
          input: { focus: [{ taskId: 9, reason: 'Looks urgent' }], later: [], summary: 'x' },
          output: 'Task 9 does not exist or is done',
          isError: false,
          isRejectedSubmit: true,
        },
      ],
      finishReason: 'tool-calls',
    },
    {
      index: 2,
      toolCalls: [
        {
          toolName: 'get_task',
          input: { id: 'one' },
          output: 'Invalid input for tool get_task: id must be a number',
          isError: true,
          isRejectedSubmit: false,
        },
      ],
      finishReason: 'tool-calls',
    },
  ],
}

export { LLM_META, PRIORITIZE_RESPONSE }
