import { afterEach, describe, expect, it, vi } from 'vitest'

import { API_URL } from '@/config/api'

import { listTasks } from './tasks'

const stubEmptyList = () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const getRequestedUrl = (fetchMock: ReturnType<typeof vi.fn>): URL =>
  new URL(String(fetchMock.mock.calls[0]?.[0]))

describe('listTasks', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the status filter and the sort', async () => {
    const fetchMock = stubEmptyList()

    await listTasks({ status: 'done', sort: 'priority' })

    const url = getRequestedUrl(fetchMock)
    expect(`${url.origin}${url.pathname}`).toBe(`${API_URL}/tasks`)
    expect(Object.fromEntries(url.searchParams)).toEqual({ status: 'done', sort: 'priority' })
  })

  it('leaves the status out when every status is shown', async () => {
    const fetchMock = stubEmptyList()

    await listTasks({ status: null, sort: 'createdAt' })

    expect(getRequestedUrl(fetchMock).searchParams.has('status')).toBe(false)
  })
})
