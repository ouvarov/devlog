import { APICallError, RetryError } from 'ai'

type LlmFailure = 'rate-limited' | 'timeout' | 'llm-error'

const HTTP_REQUEST_TIMEOUT = 408
const HTTP_TOO_MANY_REQUESTS = 429
const HTTP_GATEWAY_TIMEOUT = 504

const TIMEOUT_ERROR_NAMES: ReadonlySet<unknown> = new Set(['TimeoutError', 'AbortError'])

// The runtime passes no outside abort signal, so any abort is the total timeout; the retry
// back-off rejects with AbortError instead of the signal's TimeoutError.
const isTimeoutAbort = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  TIMEOUT_ERROR_NAMES.has(error.name)

const classifyLlmError = (error: unknown): LlmFailure => {
  if (RetryError.isInstance(error)) return classifyLlmError(error.lastError)
  if (isTimeoutAbort(error)) return 'timeout'
  if (!APICallError.isInstance(error)) return 'llm-error'

  if (error.statusCode === HTTP_TOO_MANY_REQUESTS) return 'rate-limited'
  if (error.statusCode === HTTP_REQUEST_TIMEOUT || error.statusCode === HTTP_GATEWAY_TIMEOUT) {
    return 'timeout'
  }
  return 'llm-error'
}

export { classifyLlmError }
export type { LlmFailure }
