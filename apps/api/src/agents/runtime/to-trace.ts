import type { StepResult, ToolSet } from 'ai'

import type { AgentToolCallTrace, AgentTraceStep } from '@devlog/shared'

import { isAcceptedSubmit } from './submit-result.js'

const MAX_TRACE_OUTPUT_LENGTH = 300
const TRUNCATION_MARK = '…'

type ToolOutcome = { output: unknown; isError: boolean }

const stringify = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.message
  return JSON.stringify(value) ?? String(value)
}

const truncate = (text: string): string =>
  text.length <= MAX_TRACE_OUTPUT_LENGTH
    ? text
    : `${text.slice(0, MAX_TRACE_OUTPUT_LENGTH - TRUNCATION_MARK.length)}${TRUNCATION_MARK}`

const toolOutcomesOf = <TOOLS extends ToolSet>(
  step: StepResult<TOOLS>,
): Map<string, ToolOutcome> => {
  const outcomes = new Map<string, ToolOutcome>()
  for (const part of step.content) {
    if (part.type === 'tool-result')
      outcomes.set(part.toolCallId, { output: part.output, isError: false })
    if (part.type === 'tool-error')
      outcomes.set(part.toolCallId, { output: part.error, isError: true })
  }
  return outcomes
}

const toToolCallTraces = <TOOLS extends ToolSet>(
  step: StepResult<TOOLS>,
  terminalToolNames: ReadonlySet<string>,
): AgentToolCallTrace[] => {
  const outcomes = toolOutcomesOf(step)

  return step.toolCalls.map((toolCall) => {
    const outcome = outcomes.get(toolCall.toolCallId) ?? { output: null, isError: true }
    const isSubmit = terminalToolNames.has(toolCall.toolName)
    return {
      toolName: toolCall.toolName,
      input: toolCall.input,
      output: truncate(stringify(outcome.output)),
      isError: outcome.isError,
      isRejectedSubmit: isSubmit && (outcome.isError || !isAcceptedSubmit(outcome.output)),
    }
  })
}

const toTrace = <TOOLS extends ToolSet>(
  steps: readonly StepResult<TOOLS>[],
  terminalToolNames: ReadonlySet<string>,
): AgentTraceStep[] =>
  steps.map((step) => ({
    index: step.stepNumber,
    ...(step.text ? { text: step.text } : {}),
    toolCalls: toToolCallTraces(step, terminalToolNames),
    finishReason: step.finishReason,
  }))

export { MAX_TRACE_OUTPUT_LENGTH, toTrace }
