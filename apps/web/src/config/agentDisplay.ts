import type { AgentFallbackReason, AgentSource, AgentStopReason } from '@devlog/shared'

const FALLBACK_REASON_MESSAGES = {
  'rate-limited': 'The model provider hit its rate limit.',
  timeout: 'The model did not answer in time.',
  'invalid-output': 'The model did not submit a valid plan.',
  'llm-error': 'The model provider returned an error.',
} satisfies Record<AgentFallbackReason, string>

const SOURCE_LABELS = {
  llm: 'Model',
  fallback: 'Formula, no AI',
} satisfies Record<AgentSource, string>

const STOP_REASON_LABELS = {
  submitted: 'Plan submitted',
  'step-limit': 'Step limit reached',
  error: 'Ended without a plan',
  skipped: 'Skipped, nothing open',
} satisfies Record<AgentStopReason, string>

export { FALLBACK_REASON_MESSAGES, SOURCE_LABELS, STOP_REASON_LABELS }
