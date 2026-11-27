import { afterEach, describe, expect, it, vi } from 'vitest'

import { TaskViewSchema } from '@devlog/shared'

import { ApiRequestError, requestEmpty, requestJson } from './client'

const TASK = {
  id: 1,
  title: 'Write docs',
  description: '',
  status: 'todo',
  priority: 'medium',
  parentId: null,
  subtaskCount: 0,
  subtaskDoneCount: 0,
  createdAt: '2026-11-20T10:00:00.000Z',
  updatedAt: '2026-11-20T10:00:00.000Z',
  completedAt: null,
}

const respondWith = (response: Response) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const catchError = async (request: Promise<unknown>): Promise<ApiRequestError> => {
  const error = await request.catch((caught: unknown) => caught)
  if (!(error instanceof ApiRequestError)) throw new Error('Expected an ApiRequestError')
  return error
}

describe('requestJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed body on success', async () => {
    respondWith(jsonResponse(TASK, 200))

    await expect(requestJson('/tasks/1', TaskViewSchema)).resolves.toEqual(TASK)
  })

  it('turns an API error with issues into a typed error', async () => {
    respondWith(
      jsonResponse(
        {
          statusCode: 400,
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          issues: [{ path: ['title'], message: 'Too small' }],
        },
        400,
      ),
    )

    const error = await catchError(requestJson('/tasks', TaskViewSchema))

    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      issues: [{ path: ['title'], message: 'Too small' }],
    })
  })

  it('keeps issues undefined when the API error has none', async () => {
    respondWith(
      jsonResponse({ statusCode: 404, code: 'NOT_FOUND', message: 'Task 9 not found' }, 404),
    )

    const error = await catchError(requestJson('/tasks/9', TaskViewSchema))

    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Task 9 not found' })
    expect(error.issues).toBeUndefined()
  })

  it('falls back to a generic error when the body is not an API error', async () => {
    respondWith(new Response('<html>Bad gateway</html>', { status: 502 }))

    const error = await catchError(requestJson('/tasks', TaskViewSchema))

    expect(error).toMatchObject({
      status: 502,
      code: null,
      message: 'Request failed with status 502',
    })
  })

  it('reports a network failure as a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    const error = await catchError(requestJson('/tasks', TaskViewSchema))

    expect(error.isNetworkError).toBe(true)
  })

  it('rejects a success body that does not match the schema', async () => {
    respondWith(jsonResponse({ id: 'one' }, 200))

    const error = await catchError(requestJson('/tasks/1', TaskViewSchema))

    expect(error.message).toBe('The API sent a response the app does not understand.')
  })
})

describe('requestEmpty', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves on 204 without reading a body', async () => {
    respondWith(new Response(null, { status: 204 }))

    await expect(requestEmpty('/tasks/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})

describe('API base URL', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('sends requests to NEXT_PUBLIC_API_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test:4001')
    vi.resetModules()
    const client = await import('./client')
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await client.requestEmpty('/tasks/1', { method: 'DELETE' })

    expect(fetchMock).toHaveBeenCalledWith('http://api.test:4001/tasks/1', { method: 'DELETE' })
  })
})
