import { MockLanguageModelV4 } from 'ai/test'

type MockCallOptions = Parameters<MockLanguageModelV4['doGenerate']>[0]
type MockGenerateResult = Awaited<ReturnType<MockLanguageModelV4['doGenerate']>>
type MockPrompt = MockCallOptions['prompt']
type MockStepResult = MockGenerateResult | PromiseLike<MockGenerateResult>
type MockStep = MockGenerateResult | ((options: MockCallOptions) => MockStepResult)
type MockScript = readonly MockStep[]

const MOCK_PROVIDER_ID = 'mock'
const DEFAULT_MOCK_MODEL_ID = 'scripted-mock'

const EMPTY_USAGE: MockGenerateResult['usage'] = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
}

const stepIndexOf = (prompt: MockPrompt): number =>
  prompt.filter((message) => message.role === 'assistant').length

const toolCallStep = (toolName: string, input: unknown, toolCallId = toolName): MockGenerateResult => ({
  content: [{ type: 'tool-call', toolCallId, toolName, input: JSON.stringify(input) }],
  finishReason: { unified: 'tool-calls', raw: undefined },
  usage: EMPTY_USAGE,
  warnings: [],
})

const textStep = (text: string): MockGenerateResult => ({
  content: [{ type: 'text', text }],
  finishReason: { unified: 'stop', raw: undefined },
  usage: EMPTY_USAGE,
  warnings: [],
})

const failingStep =
  (error: unknown): MockStep =>
  () => {
    throw error
  }

const toolOutputsIn = (prompt: MockPrompt, toolName: string): unknown[] =>
  prompt.flatMap((message) => {
    if (message.role !== 'tool') return []
    return message.content.flatMap((part) => {
      if (part.type !== 'tool-result' || part.toolName !== toolName) return []
      return part.output.type === 'json' ? [part.output.value] : []
    })
  })

const resolveStep = (script: MockScript, options: MockCallOptions): MockStepResult => {
  const lastStep = script.at(-1)
  const step = script[stepIndexOf(options.prompt)] ?? lastStep
  if (step === undefined) return textStep('The mock script is empty.')

  return typeof step === 'function' ? step(options) : step
}

const createScriptedModel = (
  script: MockScript,
  modelId = DEFAULT_MOCK_MODEL_ID,
): MockLanguageModelV4 =>
  new MockLanguageModelV4({
    provider: MOCK_PROVIDER_ID,
    modelId,
    doGenerate: (options) => Promise.resolve().then(() => resolveStep(script, options)),
  })

export { createScriptedModel, failingStep, textStep, toolCallStep, toolOutputsIn }
export type { MockCallOptions, MockGenerateResult, MockPrompt, MockScript, MockStep }
