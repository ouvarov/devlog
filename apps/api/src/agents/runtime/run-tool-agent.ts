import {
  type LanguageModel,
  type StepResult,
  type StopCondition,
  ToolChoiceViolationError,
  type ToolSet,
  generateText,
  isStepCount,
} from 'ai'

import type { AgentTraceStep, AgentUsage } from '@devlog/shared'

import { type LlmFailure, classifyLlmError } from './classify-llm-error.js'
import { isAcceptedSubmit } from './submit-result.js'
import { toTrace } from './to-trace.js'

const AGENT_TOTAL_TIMEOUT_MS = 25_000
const AGENT_MAX_RETRIES = 1

type ToolAgentOptions<TOOLS extends ToolSet> = {
  model: LanguageModel
  instructions: string
  prompt: string
  tools: TOOLS
  terminalToolNames: readonly (keyof TOOLS & string)[]
  maxSteps: number
}

type ToolAgentOutcome =
  | { status: 'submitted'; toolName: string; submission: unknown }
  | { status: 'step-limit' }
  | { status: 'no-submit' }
  | { status: 'failed'; failure: LlmFailure; error: unknown }

type ToolAgentRun = ToolAgentOutcome & {
  trace: AgentTraceStep[]
  stepCount: number
  usage: AgentUsage
  durationMs: number
}

type AcceptedTerminalCall = { toolName: string; value: unknown }

// Parallel calls can finish in any order, so when one step has several accepted terminal
// calls the order of terminalToolNames decides, not the order of the results.
const findAcceptedTerminalCall = <TOOLS extends ToolSet>(
  step: StepResult<TOOLS> | undefined,
  terminalToolNames: readonly string[],
): AcceptedTerminalCall | undefined => {
  if (!step) return undefined

  const acceptedValues = new Map<string, unknown>()
  for (const { toolName, output } of step.toolResults) {
    const terminalOutput: unknown = output
    if (!acceptedValues.has(toolName) && isAcceptedSubmit(terminalOutput)) {
      acceptedValues.set(toolName, terminalOutput.value)
    }
  }

  const toolName = terminalToolNames.find((name) => acceptedValues.has(name))
  return toolName === undefined ? undefined : { toolName, value: acceptedValues.get(toolName) }
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
  const { model, instructions, prompt, tools, terminalToolNames, maxSteps } = options
  const terminalToolNameSet: ReadonlySet<string> = new Set(terminalToolNames)
  const steps: StepResult<TOOLS>[] = []
  const startedAtMs = Date.now()

  const finish = (outcome: ToolAgentOutcome): ToolAgentRun => ({
    ...outcome,
    trace: toTrace(steps, terminalToolNameSet),
    stepCount: steps.length,
    usage: sumUsage(steps),
    durationMs: Date.now() - startedAtMs,
  })

  const isTerminalCallAccepted: StopCondition<TOOLS> = ({ steps: finishedSteps }) =>
    findAcceptedTerminalCall(finishedSteps.at(-1), terminalToolNames) !== undefined

  try {
    await generateText({
      model,
      instructions,
      prompt,
      tools,
      stopWhen: [isStepCount(maxSteps), isTerminalCallAccepted],
      prepareStep: ({ stepNumber }) =>
        stepNumber === maxSteps - 1
          ? { activeTools: terminalToolNames, toolChoice: 'required' }
          : undefined,
      timeout: { totalMs: AGENT_TOTAL_TIMEOUT_MS },
      maxRetries: AGENT_MAX_RETRIES,
      onStepEnd: (step) => {
        steps.push(step)
      },
    })
  } catch (error) {
    // Only the forced last step sets a tool choice: a violation means no terminal call within the limit.
    if (ToolChoiceViolationError.isInstance(error)) return finish({ status: 'step-limit' })
    return finish({ status: 'failed', failure: classifyLlmError(error), error })
  }

  const accepted = findAcceptedTerminalCall(steps.at(-1), terminalToolNames)
  if (accepted) {
    return finish({ status: 'submitted', toolName: accepted.toolName, submission: accepted.value })
  }

  return finish({ status: steps.length >= maxSteps ? 'step-limit' : 'no-submit' })
}

export { AGENT_MAX_RETRIES, AGENT_TOTAL_TIMEOUT_MS, runToolAgent }
export type { ToolAgentOptions, ToolAgentOutcome, ToolAgentRun }
