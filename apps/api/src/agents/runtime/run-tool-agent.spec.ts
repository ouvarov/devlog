import { tool } from 'ai'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { badRequestError, rateLimitError, timeoutAbortError } from '../../llm/mock/mock-failures.js'
import {
  type MockCallOptions,
  type MockScript,
  createScriptedModel,
  failingStep,
  textStep,
  toolCallStep,
} from '../../llm/mock/scripted-model.js'
import { AGENT_TOTAL_TIMEOUT_MS, runToolAgent } from './run-tool-agent.js'
import type { SubmitResult } from './submit-result.js'
import { MAX_TRACE_OUTPUT_LENGTH } from './to-trace.js'

const MAX_STEPS = 4
const LONG_OUTPUT = 'x'.repeat(1000)

const tools = {
  lookup: tool({
    description: 'Returns a long text',
    inputSchema: z.object({}),
    execute: () => Promise.resolve(LONG_OUTPUT),
  }),
  submit: tool({
    description: 'Accepts only the answer ok',
    inputSchema: z.object({ answer: z.string() }),
    execute: ({ answer }): Promise<SubmitResult<string>> =>
      Promise.resolve(
        answer === 'ok'
          ? { accepted: true, value: answer }
          : { accepted: false, errors: [`answer must be ok, got ${answer}`] },
      ),
  }),
}

const runScript = (script: MockScript) => {
  const model = createScriptedModel(script)
  const run = runToolAgent({
    model,
    instructions: 'Test agent',
    prompt: 'Go',
    tools,
    submitToolName: 'submit',
    maxSteps: MAX_STEPS,
  })
  return { model, run }
}

const abortWhenSignalled = (options: MockCallOptions) =>
  new Promise<never>((_resolve, reject) => {
    options.abortSignal?.addEventListener('abort', () => {
      reject(options.abortSignal?.reason)
    })
  })

describe('runToolAgent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stops on the first accepted submit', async () => {
    const { model, run } = runScript([
      toolCallStep('lookup', {}),
      toolCallStep('submit', { answer: 'ok' }),
      toolCallStep('lookup', {}),
    ])

    const result = await run

    expect(result).toMatchObject({ status: 'submitted', submission: 'ok', stepCount: 2 })
    expect(model.doGenerateCalls).toHaveLength(2)
  })

  it('returns a rejected submit to the model and marks it in the trace', async () => {
    const { model, run } = runScript([
      toolCallStep('submit', { answer: 'no' }),
      toolCallStep('submit', { answer: 'ok' }),
    ])

    const result = await run

    expect(result.status).toBe('submitted')
    expect(result.trace.map((step) => step.toolCalls[0]?.isRejectedSubmit)).toEqual([true, false])
    expect(JSON.stringify(model.doGenerateCalls[1]?.prompt)).toContain('answer must be ok, got no')
  })

  it('leaves only the submit tool, required, on the last allowed step', async () => {
    const { model, run } = runScript([toolCallStep('lookup', {})])

    const result = await run

    const lastCall = model.doGenerateCalls[MAX_STEPS - 1]
    expect(result).toMatchObject({ status: 'step-limit', stepCount: MAX_STEPS })
    expect(lastCall?.tools?.map(({ name }) => name)).toEqual(['submit'])
    expect(lastCall?.toolChoice).toEqual({ type: 'required' })
    expect(model.doGenerateCalls[0]?.tools?.map(({ name }) => name)).toEqual(['lookup', 'submit'])
  })

  it('reports a model that answers with text and no submit', async () => {
    const { run } = runScript([textStep('I think task 1 first.')])

    const result = await run

    expect(result).toMatchObject({ status: 'no-submit', stepCount: 1 })
    expect(result.trace[0]?.text).toBe('I think task 1 first.')
  })

  it('cuts tool outputs in the trace to 300 characters', async () => {
    const { run } = runScript([toolCallStep('lookup', {}), toolCallStep('submit', { answer: 'ok' })])

    const result = await run

    const lookupOutput = result.trace[0]?.toolCalls[0]?.output ?? ''
    expect(lookupOutput).toHaveLength(MAX_TRACE_OUTPUT_LENGTH)
    expect(lookupOutput.endsWith('…')).toBe(true)
  })

  it('retries a 429 once, then reports rate-limited with the steps that ran', async () => {
    const { model, run } = runScript([toolCallStep('lookup', {}), failingStep(rateLimitError())])

    const result = await run

    expect(result).toMatchObject({ status: 'failed', failure: 'rate-limited', stepCount: 1 })
    expect(result.trace).toHaveLength(1)
    expect(model.doGenerateCalls).toHaveLength(3)
  })

  it('aborts the run with a timeout after 25 seconds in total', async () => {
    const timeoutController = new AbortController()
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal)
    const { run } = runScript([
      toolCallStep('lookup', {}),
      (options) => {
        const aborted = abortWhenSignalled(options)
        timeoutController.abort(timeoutAbortError())
        return aborted
      },
    ])

    const result = await run

    expect(timeoutSpy).toHaveBeenCalledWith(AGENT_TOTAL_TIMEOUT_MS)
    expect(result).toMatchObject({ status: 'failed', failure: 'timeout', stepCount: 1 })
  })

  it('reports a non-retryable provider error as llm-error', async () => {
    const { run } = runScript([failingStep(badRequestError())])

    const result = await run

    expect(result).toMatchObject({ status: 'failed', failure: 'llm-error', stepCount: 0 })
    expect(result.trace).toEqual([])
  })
})
