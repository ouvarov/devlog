import { type ApiErrorCode, ApiErrorSchema, type ApiIssue } from '@devlog/shared'

import { API_URL } from '@/config/api'

type ResponseSchema<T> = {
  safeParse: (body: unknown) => { success: true; data: T } | { success: false }
}

type ApiRequestErrorInit = {
  message: string
  status: number | null
  code?: ApiErrorCode | null
  issues?: ApiIssue[]
  cause?: unknown
}

const NETWORK_ERROR_MESSAGE = 'Cannot reach the API. Check that it is running.'
const UNEXPECTED_RESPONSE_MESSAGE = 'The API sent a response the app does not understand.'

class ApiRequestError extends Error {
  readonly status: number | null
  readonly code: ApiErrorCode | null
  readonly issues: ApiIssue[] | undefined

  constructor({ message, status, code = null, issues, cause }: ApiRequestErrorInit) {
    super(message, { cause })
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.issues = issues
  }

  get isNetworkError(): boolean {
    return this.status === null
  }
}

const readJson = async (response: Response): Promise<unknown> => {
  const body: unknown = await response.json().catch(() => null)
  return body
}

const toResponseError = (status: number, body: unknown): ApiRequestError => {
  const apiError = ApiErrorSchema.safeParse(body)
  if (!apiError.success) {
    return new ApiRequestError({ message: `Request failed with status ${status}`, status })
  }

  const { message, code, issues } = apiError.data
  return new ApiRequestError({ message, status, code, issues })
}

const send = async (path: string, init: RequestInit): Promise<Response> => {
  const response = await fetch(`${API_URL}${path}`, init).catch((error: unknown) => {
    if (init.signal?.aborted) throw error
    throw new ApiRequestError({ message: NETWORK_ERROR_MESSAGE, status: null, cause: error })
  })

  if (!response.ok) throw toResponseError(response.status, await readJson(response))
  return response
}

const requestJson = async <T>(
  path: string,
  schema: ResponseSchema<T>,
  init: RequestInit = {},
): Promise<T> => {
  const response = await send(path, init)
  const parsed = schema.safeParse(await readJson(response))
  if (!parsed.success) {
    throw new ApiRequestError({ message: UNEXPECTED_RESPONSE_MESSAGE, status: response.status })
  }

  return parsed.data
}

const requestEmpty = async (path: string, init: RequestInit = {}): Promise<void> => {
  await send(path, init)
}

const jsonBody = (value: unknown): Pick<RequestInit, 'body' | 'headers'> => ({
  body: JSON.stringify(value),
  headers: { 'Content-Type': 'application/json' },
})

export { ApiRequestError, jsonBody, requestEmpty, requestJson }
