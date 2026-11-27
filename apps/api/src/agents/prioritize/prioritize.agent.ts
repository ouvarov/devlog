import { Inject, Injectable, Logger } from '@nestjs/common'

import {
  type AgentFallbackReason,
  type AgentInfo,
  type AgentMeta,
  type AgentStopReason,
  PrioritizePlanSchema,
  type PrioritizeResponse,
  type TaskView,
} from '@devlog/shared'

import { type ConfiguredLlm, type LlmConnection, requireConfiguredLlm } from '../../llm/llm-connection.js'
import { LLM } from '../../llm/llm.tokens.js'
import { TasksReader } from '../../tasks/tasks.reader.js'
import { type ToolAgentRun, runToolAgent } from '../runtime/run-tool-agent.js'
import { buildFallbackPlan } from './prioritize-fallback.js'
import {
  OPEN_TASKS_SNAPSHOT_LIMIT,
  PRIORITIZE_TOOL_NAMES,
  SUBMIT_PLAN_TOOL,
  createPrioritizeTools,
} from './prioritize-tools.js'
import { PRIORITIZE_INSTRUCTIONS } from './prioritize.instructions.js'

const PRIORITIZE_MAX_STEPS = 6
const SKIPPED_SUMMARY = 'There are no open tasks to prioritize.'

const PRIORITIZE_AGENT_INFO: AgentInfo = {
  name: 'prioritize',
  maxSteps: PRIORITIZE_MAX_STEPS,
  tools: [...PRIORITIZE_TOOL_NAMES],
}

type FallbackOutcome = { stoppedBy: AgentStopReason; fallbackReason: AgentFallbackReason }

const buildPrompt = (openTaskCount: number, now: Date): string =>
  [
    `Today is ${now.toISOString().slice(0, 10)}.`,
    `There are ${openTaskCount} open tasks.`,
    'Decide what to focus on now and submit the plan with submit_plan.',
  ].join('\n')

const fallbackOutcomeOf = (run: ToolAgentRun): FallbackOutcome => {
  if (run.status === 'failed') return { stoppedBy: 'error', fallbackReason: run.failure }
  if (run.status === 'step-limit') return { stoppedBy: 'step-limit', fallbackReason: 'invalid-output' }
  return { stoppedBy: 'error', fallbackReason: 'invalid-output' }
}

const errorMessageOf = (run: ToolAgentRun): string => {
  if (run.status !== 'failed') return run.status
  return run.error instanceof Error ? run.error.message : String(run.error)
}

@Injectable()
export class PrioritizeAgent {
  private readonly logger = new Logger(PrioritizeAgent.name)

  constructor(
    @Inject(LLM) private readonly llm: LlmConnection,
    private readonly tasksReader: TasksReader,
  ) {}

  async run(): Promise<PrioritizeResponse> {
    const llm = requireConfiguredLlm(this.llm)
    const now = new Date()
    const openTasks = await this.tasksReader.listOpen({}, OPEN_TASKS_SNAPSHOT_LIMIT)
    if (openTasks.length === 0) return this.skipped(llm)

    const run = await runToolAgent({
      model: llm.model,
      instructions: PRIORITIZE_INSTRUCTIONS,
      prompt: buildPrompt(openTasks.length, now),
      tools: createPrioritizeTools(this.tasksReader, now),
      submitToolName: SUBMIT_PLAN_TOOL,
      maxSteps: PRIORITIZE_MAX_STEPS,
    })
    return this.toResponse(llm, run, openTasks, now)
  }

  private toResponse(
    llm: ConfiguredLlm,
    run: ToolAgentRun,
    openTasks: readonly TaskView[],
    now: Date,
  ): PrioritizeResponse {
    const runMeta = {
      provider: llm.provider,
      modelId: llm.modelId,
      steps: run.stepCount,
      usage: run.usage,
      durationMs: run.durationMs,
    }
    const submittedPlan =
      run.status === 'submitted' ? PrioritizePlanSchema.safeParse(run.submission) : undefined
    if (submittedPlan?.success) {
      this.logger.log(`prioritize submitted in ${run.stepCount} steps, ${run.durationMs} ms`)
      return {
        plan: submittedPlan.data,
        meta: { ...runMeta, source: 'llm', stoppedBy: 'submitted' },
        trace: run.trace,
      }
    }

    const fallback = fallbackOutcomeOf(run)
    this.logger.warn(
      `prioritize fell back (${fallback.fallbackReason}) after ${run.stepCount} steps: ${errorMessageOf(run)}`,
    )
    const meta: AgentMeta = { ...runMeta, source: 'fallback', ...fallback }
    return { plan: buildFallbackPlan(openTasks, fallback.fallbackReason, now), meta, trace: run.trace }
  }

  private skipped(llm: ConfiguredLlm): PrioritizeResponse {
    return {
      plan: { focus: [], later: [], summary: SKIPPED_SUMMARY },
      meta: {
        provider: llm.provider,
        modelId: llm.modelId,
        source: 'fallback',
        stoppedBy: 'skipped',
        steps: 0,
        usage: { inputTokens: 0, outputTokens: 0 },
        durationMs: 0,
      },
      trace: [],
    }
  }
}

export { PRIORITIZE_AGENT_INFO }
