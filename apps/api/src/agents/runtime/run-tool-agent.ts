import {
  type LanguageModel,
  type StepResult,
  type StopCondition,
  type ToolSet,
  generateText,
  isStepCount,
} from 'ai'

import type { AgentTraceStep, AgentUsage } from '@devlog/shared'

import { type LlmFailure, classifyLlmError } from './classify-llm-error.js'
import { type AcceptedSubmit, isAcceptedSubmit } from './submit-result.js'
import { toTrace } from './to-trace.js'

const AGENT_TOTAL_TIMEOUT_MS = 25_000
const AGENT_MAX_RETRIES = 1

type ToolAgentOptions<TOOLS extends ToolSet> = {
  model: LanguageModel
  instructions: string
  prompt: string
  tools: TOOLS
  submitToolName: keyof TOOLS & string
  maxSteps: number
}

type ToolAgentOutcome =
  | { status: 'submitted'; submission: unknown }
  | { status: 'step-limit' }
  | { status: 'no-submit' }
  | { status: 'failed'; failure: LlmFailure; error: unknown }

type ToolAgentRun = ToolAgentOutcome & {
  trace: AgentTraceStep[]
  stepCount: number
  usage: AgentUsage
  durationMs: number
}

const findAcceptedSubmission = <TOOLS extends ToolSet>(
  step: StepResult<TOOLS> | undefined,
  submitToolName: string,
): AcceptedSubmit<unknown> | undefined => {
  if (!step) return undefined

  const submitOutputs = step.toolResults
    .filter((toolResult) => toolResult.toolName === submitToolName)
    .map((toolResult): unknown => toolResult.output)
  return submitOutputs.find(isAcceptedSubmit)
}

const sumUsage = <TOOLS extends ToolSet>(steps: readonly StepResult<TOOLS>[]): AgentUsage =>
  steps.reduce<AgentUsage>(
    (total, { usage }) => ({
      inputTokens: total.inputTokens + (usage.inputTokens ?? 0),
      outputTokens: total.outputTokens + (usage.outputTokens ?? 0),
    }),
    { inputTokens: 0, outputTokens: 0 },
  )

const runToolAgent = async <TOOLS extends ToolSet>(
  options: ToolAgentOptions<TOOLS>,
): Promise<ToolAgentRun> => {
  const { model, instructions, prompt, tools, submitToolName, maxSteps } = options
  const steps: StepResult<TOOLS>[] = []
  const startedAtMs = Date.now()

  const finish = (outcome: ToolAgentOutcome): ToolAgentRun => ({
    ...outcome,
    trace: toTrace(steps, submitToolName),
    stepCount: steps.length,
    usage: sumUsage(steps),
    durationMs: Date.now() - startedAtMs,
  })

  const isSubmitAccepted: StopCondition<TOOLS> = ({ steps: finishedSteps }) =>
    findAcceptedSubmission(finishedSteps.at(-1), submitToolName) !== undefined

  try {
    await generateText({
      model,
      instructions,
      prompt,
      tools,
      stopWhen: [isStepCount(maxSteps), isSubmitAccepted],
      prepareStep: ({ stepNumber }) =>
        stepNumber === maxSteps - 1
          ? { activeTools: [submitToolName], toolChoice: 'required' }
          : undefined,
      timeout: { totalMs: AGENT_TOTAL_TIMEOUT_MS },
      maxRetries: AGENT_MAX_RETRIES,
      onStepEnd: (step) => {
        steps.push(step)
      },
    })
  } catch (error) {
    return finish({ status: 'failed', failure: classifyLlmError(error), error })
  }

  const accepted = findAcceptedSubmission(steps.at(-1), submitToolName)
  if (accepted) return finish({ status: 'submitted', submission: accepted.value })

  return finish({ status: steps.length >= maxSteps ? 'step-limit' : 'no-submit' })
}

export { AGENT_MAX_RETRIES, AGENT_TOTAL_TIMEOUT_MS, runToolAgent }
export type { ToolAgentOptions, ToolAgentOutcome, ToolAgentRun }
