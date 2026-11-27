import { z } from 'zod'

import { TaskIdSchema } from './task.js'

const LLM_PROVIDERS = ['google', 'mock'] as const
const AGENT_NAMES = ['prioritize'] as const
const AGENT_SOURCES = ['llm', 'fallback'] as const
const AGENT_STOP_REASONS = ['submitted', 'step-limit', 'error', 'skipped'] as const
const AGENT_FALLBACK_REASONS = ['rate-limited', 'timeout', 'invalid-output', 'llm-error'] as const

const PLAN_REASON_MAX_LENGTH = 200
const PLAN_SUMMARY_MAX_LENGTH = 400
const PLAN_FOCUS_MIN_SIZE = 3
const PLAN_FOCUS_MAX_SIZE = 5

const LlmProviderSchema = z.enum(LLM_PROVIDERS)
const AgentNameSchema = z.enum(AGENT_NAMES)

const AgentInfoSchema = z
  .object({
    name: AgentNameSchema,
    maxSteps: z.int().positive(),
    tools: z.array(z.string()),
  })
  .strict()

const AgentsInfoSchema = z
  .object({
    isConfigured: z.boolean(),
    provider: LlmProviderSchema,
    modelId: z.string().nullable(),
    agents: z.array(AgentInfoSchema),
  })
  .strict()

const AgentUsageSchema = z
  .object({
    inputTokens: z.int().nonnegative(),
    outputTokens: z.int().nonnegative(),
  })
  .strict()

const AgentMetaSchema = z
  .object({
    provider: LlmProviderSchema,
    modelId: z.string(),
    source: z.enum(AGENT_SOURCES),
    stoppedBy: z.enum(AGENT_STOP_REASONS),
    fallbackReason: z.enum(AGENT_FALLBACK_REASONS).optional(),
    steps: z.int().nonnegative(),
    usage: AgentUsageSchema,
    durationMs: z.int().nonnegative(),
  })
  .strict()

const AgentToolCallTraceSchema = z
  .object({
    toolName: z.string(),
    input: z.unknown(),
    output: z.string(),
    isError: z.boolean(),
    isRejectedSubmit: z.boolean(),
  })
  .strict()

const AgentTraceStepSchema = z
  .object({
    index: z.int().nonnegative(),
    text: z.string().optional(),
    toolCalls: z.array(AgentToolCallTraceSchema),
    finishReason: z.string(),
  })
  .strict()

const PlanFocusItemSchema = z
  .object({
    taskId: TaskIdSchema,
    reason: z.string().trim().min(1).max(PLAN_REASON_MAX_LENGTH),
  })
  .strict()

const PrioritizePlanSchema = z
  .object({
    focus: z.array(PlanFocusItemSchema).max(PLAN_FOCUS_MAX_SIZE),
    later: z.array(TaskIdSchema),
    summary: z.string().trim().min(1).max(PLAN_SUMMARY_MAX_LENGTH),
  })
  .strict()

const PrioritizeRequestSchema = z.object({}).strict()

const PrioritizeResponseSchema = z
  .object({
    plan: PrioritizePlanSchema,
    meta: AgentMetaSchema,
    trace: z.array(AgentTraceStepSchema),
  })
  .strict()

type LlmProvider = z.infer<typeof LlmProviderSchema>
type AgentName = z.infer<typeof AgentNameSchema>
type AgentInfo = z.infer<typeof AgentInfoSchema>
type AgentsInfo = z.infer<typeof AgentsInfoSchema>
type AgentSource = (typeof AGENT_SOURCES)[number]
type AgentStopReason = (typeof AGENT_STOP_REASONS)[number]
type AgentFallbackReason = (typeof AGENT_FALLBACK_REASONS)[number]
type AgentUsage = z.infer<typeof AgentUsageSchema>
type AgentMeta = z.infer<typeof AgentMetaSchema>
type AgentToolCallTrace = z.infer<typeof AgentToolCallTraceSchema>
type AgentTraceStep = z.infer<typeof AgentTraceStepSchema>
type PlanFocusItem = z.infer<typeof PlanFocusItemSchema>
type PrioritizePlan = z.infer<typeof PrioritizePlanSchema>
type PrioritizeRequest = z.infer<typeof PrioritizeRequestSchema>
type PrioritizeResponse = z.infer<typeof PrioritizeResponseSchema>

export {
  AGENT_FALLBACK_REASONS,
  AGENT_NAMES,
  AGENT_SOURCES,
  AGENT_STOP_REASONS,
  AgentInfoSchema,
  AgentMetaSchema,
  AgentNameSchema,
  AgentsInfoSchema,
  AgentToolCallTraceSchema,
  AgentTraceStepSchema,
  AgentUsageSchema,
  LLM_PROVIDERS,
  LlmProviderSchema,
  PLAN_FOCUS_MAX_SIZE,
  PLAN_FOCUS_MIN_SIZE,
  PLAN_REASON_MAX_LENGTH,
  PLAN_SUMMARY_MAX_LENGTH,
  PlanFocusItemSchema,
  PrioritizePlanSchema,
  PrioritizeRequestSchema,
  PrioritizeResponseSchema,
}
export type {
  AgentFallbackReason,
  AgentInfo,
  AgentMeta,
  AgentName,
  AgentsInfo,
  AgentSource,
  AgentStopReason,
  AgentToolCallTrace,
  AgentTraceStep,
  AgentUsage,
  LlmProvider,
  PlanFocusItem,
  PrioritizePlan,
  PrioritizeRequest,
  PrioritizeResponse,
}
