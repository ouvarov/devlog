import type { AgentMeta, AgentTraceStep, DecomposeResponse } from '@devlog/shared'

const DECOMPOSE_META: AgentMeta = {
  provider: 'mock',
  modelId: 'mock-decompose',
  source: 'llm',
  stoppedBy: 'submitted',
  steps: 2,
  usage: { inputTokens: 800, outputTokens: 120 },
  durationMs: 1700,
}

const SEARCH_STEP: AgentTraceStep = {
  index: 0,
  toolCalls: [
    {
      toolName: 'search_tasks',
      input: { query: 'onboarding' },
      output: '[]',
      isError: false,
      isRejectedSubmit: false,
    },
  ],
  finishReason: 'tool-calls',
}

const CLARIFY_RESPONSE: DecomposeResponse = {
  kind: 'clarify',
  questions: ['Which screens are confusing?', '<b>Who</b> is the user?'],
  meta: DECOMPOSE_META,
  trace: [SEARCH_STEP],
}

const PROPOSAL_RESPONSE: DecomposeResponse = {
  kind: 'proposal',
  items: [
    { title: 'Map the signup steps', priority: 'medium', status: 'todo' },
    {
      title: 'Rewrite the welcome email',
      description: 'Shorter, one link.',
      priority: 'low',
      status: 'todo',
    },
    { title: '<img src=x onerror=alert(1)>', priority: 'high', status: 'in-progress' },
  ],
  assumptions: ['The web app only, not mobile.'],
  meta: DECOMPOSE_META,
  trace: [SEARCH_STEP],
}

export { CLARIFY_RESPONSE, PROPOSAL_RESPONSE, SEARCH_STEP }
