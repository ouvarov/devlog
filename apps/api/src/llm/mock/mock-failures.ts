import { APICallError } from 'ai'

const MOCK_API_URL = 'https://mock.invalid/v1/generate'

const rateLimitError = (): APICallError =>
  new APICallError({
    message: 'Resource has been exhausted (e.g. check quota).',
    url: MOCK_API_URL,
    requestBodyValues: {},
    statusCode: 429,
    responseHeaders: { 'retry-after-ms': '0' },
  })

const badRequestError = (): APICallError =>
  new APICallError({
    message: 'Request contains an invalid argument.',
    url: MOCK_API_URL,
    requestBodyValues: {},
    statusCode: 400,
  })

const timeoutAbortError = (): DOMException =>
  new DOMException('The operation was aborted due to timeout', 'TimeoutError')

export { badRequestError, rateLimitError, timeoutAbortError }
