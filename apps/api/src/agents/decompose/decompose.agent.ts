import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'

import {
  type AgentInfo,
  type AgentMeta,
  type DecomposeClarify,
  DecomposeClarifySchema,
  type DecomposeProposal,
  DecomposeProposalSchema,
  type DecomposeRequest,
  type DecomposeResponse,
  type TaskDetail,
} from '@devlog/shared'

import { AgentFailedException } from '../../common/errors/agent-failed.exception.js'
import {
  type ConfiguredLlm,
  type LlmConnection,
  requireConfiguredLlm,
} from '../../llm/llm-connection.js'
import { LLM } from '../../llm/llm.tokens.js'
import { TasksReader } from '../../tasks/tasks.reader.js'
import type { LlmFailure } from '../runtime/classify-llm-error.js'
import { type ToolAgentRun, runToolAgent } from '../runtime/run-tool-agent.js'
import { decomposeModeOf } from './decompose-mode.js'
import { buildDecomposePrompt } from './decompose-prompt.js'
import {
  ASK_CLARIFICATION_TOOL,
  DECOMPOSE_TOOL_NAMES,
  SUBMIT_SUBTASKS_TOOL,
  createDecomposeToolkit,
} from './decompose-tools.js'
import { DECOMPOSE_INSTRUCTIONS } from './decompose.instructions.js'

const DECOMPOSE_MAX_STEPS = 6

const DECOMPOSE_AGENT_INFO: AgentInfo = {
  name: 'decompose',
  maxSteps: DECOMPOSE_MAX_STEPS,
  tools: [...DECOMPOSE_TOOL_NAMES],
}

type DecomposeAnswer =
  ({ kind: 'clarify' } & DecomposeClarify) | ({ kind: 'proposal' } & DecomposeProposal)

const LLM_FAILURE_MESSAGES: Record<LlmFailure, string> = {
  'rate-limited': 'The model is rate limited; try again in a minute',
  timeout: 'The model did not answer in time',
  'llm-error': 'The model call failed',
}

const failureMessageOf = (run: ToolAgentRun): string => {
  if (run.status === 'failed') return LLM_FAILURE_MESSAGES[run.failure]
  if (run.status === 'step-limit') {
    return `The agent gave no valid answer within ${DECOMPOSE_MAX_STEPS} steps`
  }
  if (run.status === 'no-submit') return 'The agent stopped without an answer'
  return 'The agent answer did not pass validation'
}

const answerOf = (run: ToolAgentRun): DecomposeAnswer | undefined => {
  if (run.status !== 'submitted') return undefined

  if (run.toolName === ASK_CLARIFICATION_TOOL) {
    const clarify = DecomposeClarifySchema.safeParse(run.submission)
    return clarify.success ? { kind: 'clarify', ...clarify.data } : undefined
  }
  if (run.toolName === SUBMIT_SUBTASKS_TOOL) {
    const proposal = DecomposeProposalSchema.safeParse(run.submission)
    return proposal.success ? { kind: 'proposal', ...proposal.data } : undefined
  }
  return undefined
}

const errorDetailOf = (run: ToolAgentRun): string => {
  if (run.status !== 'failed') return run.status
  return run.error instanceof Error ? run.error.message : String(run.error)
}

@Injectable()
export class DecomposeAgent {
  private readonly logger = new Logger(DecomposeAgent.name)

  constructor(
    @Inject(LLM) private readonly llm: LlmConnection,
    private readonly tasksReader: TasksReader,
  ) {}

  async run(request: DecomposeRequest): Promise<DecomposeResponse> {
    const llm = requireConfiguredLlm(this.llm)
    const task = await this.findSplittableTask(request.taskId)
    const toolkit = createDecomposeToolkit(this.tasksReader, task, decomposeModeOf(request))

    const run = await runToolAgent({
      model: llm.model,
      instructions: DECOMPOSE_INSTRUCTIONS,
      prompt: buildDecomposePrompt(task, request),
      ...toolkit,
      maxSteps: DECOMPOSE_MAX_STEPS,
    })
    return this.toResponse(llm, run)
  }

  private async findSplittableTask(taskId: number): Promise<TaskDetail> {
    const task = await this.tasksReader.findDetail(taskId)
    if (!task) throw new NotFoundException(`Task ${taskId} not found`)
    if (task.parentId !== null) {
      throw new BadRequestException(`Task ${taskId} is a subtask and cannot be split`)
    }
    if (task.status === 'done') {
      throw new BadRequestException(`Task ${taskId} is done and cannot be split`)
    }
    return task
  }

  private toResponse(llm: ConfiguredLlm, run: ToolAgentRun): DecomposeResponse {
    const answer = answerOf(run)
    if (!answer) {
      this.logger.warn(`decompose failed after ${run.stepCount} steps: ${errorDetailOf(run)}`)
      throw new AgentFailedException(failureMessageOf(run), run.trace)
    }

    this.logger.log(
      `decompose answered ${answer.kind} in ${run.stepCount} steps, ${run.durationMs} ms`,
    )
    const meta: AgentMeta = {
      provider: llm.provider,
      modelId: llm.modelId,
      source: 'llm',
      stoppedBy: 'submitted',
      steps: run.stepCount,
      usage: run.usage,
      durationMs: run.durationMs,
    }
    return { ...answer, meta, trace: run.trace }
  }
}

export { DECOMPOSE_AGENT_INFO, DECOMPOSE_MAX_STEPS }
