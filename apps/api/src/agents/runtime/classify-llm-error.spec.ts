import { APICallError, RetryError } from 'ai'
import { describe, expect, it } from 'vitest'

import { badRequestError, rateLimitError, timeoutAbortError } from '../../llm/mock/mock-failures.js'
import { classifyLlmError } from './classify-llm-error.js'

const apiErrorWithStatus = (statusCode: number): APICallError =>
  new APICallError({ message: 'Failed', url: 'https://mock.invalid', requestBodyValues: {}, statusCode })

describe('classifyLlmError', () => {
  it('reports a 429 as rate-limited', () => {
    expect(classifyLlmError(rateLimitError())).toBe('rate-limited')
  })

  it('reports a 429 after the retries ran out as rate-limited', () => {
    const retryError = new RetryError({
      message: 'Failed after 2 attempts',
      reason: 'maxRetriesExceeded',
      errors: [rateLimitError(), rateLimitError()],
    })

    expect(classifyLlmError(retryError)).toBe('rate-limited')
  })

  it('reports the total timeout abort as timeout', () => {
    expect(classifyLlmError(timeoutAbortError())).toBe('timeout')
  })

  it('reports a provider deadline as timeout', () => {
    expect(classifyLlmError(apiErrorWithStatus(504))).toBe('timeout')
  })

  it('reports anything else as llm-error', () => {
    expect(classifyLlmError(badRequestError())).toBe('llm-error')
    expect(classifyLlmError(new Error('socket hang up'))).toBe('llm-error')
    expect(classifyLlmError('unknown')).toBe('llm-error')
  })
})
