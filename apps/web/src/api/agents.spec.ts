import { afterEach, describe, expect, it, vi } from 'vitest'

import { PRIORITIZE_RESPONSE } from '@/fixtures/prioritizeResponse'

import { runPrioritize } from './agents'
import { ApiRequestError } from './client'

const respondWith = (body: unknown, status: number) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )

const catchError = async (request: Promise<unknown>): Promise<ApiRequestError> => {
  const error = await request.catch((caught: unknown) => caught)
  if (!(error instanceof ApiRequestError)) throw new Error('Expected an ApiRequestError')
  return error
}

describe('runPrioritize', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a response that matches the shared schema', async () => {
    respondWith(PRIORITIZE_RESPONSE, 200)

    await expect(runPrioritize()).resolves.toEqual(PRIORITIZE_RESPONSE)
  })

  it('rejects a response with a field the schema does not know', async () => {
    respondWith({ ...PRIORITIZE_RESPONSE, extra: true }, 200)

    const error = await catchError(runPrioritize())

    expect(error.message).toBe('The API sent a response the app does not understand.')
  })

  it('turns a 503 without an LLM into a readable error', async () => {
    respondWith(
      {
        statusCode: 503,
        code: 'LLM_NOT_CONFIGURED',
        message: 'No LLM is configured: set GOOGLE_GENERATIVE_AI_API_KEY or LLM_PROVIDER=mock',
      },
      503,
    )

    const error = await catchError(runPrioritize())

    expect(error).toMatchObject({ status: 503, code: 'LLM_NOT_CONFIGURED' })
    expect(error.message).toContain('GOOGLE_GENERATIVE_AI_API_KEY')
  })
})
