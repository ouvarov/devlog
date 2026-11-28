import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'

import { ApiRequestError } from './client'
import { invalidateAgentsIfNotConfigured } from './invalidateAgents'
import { AGENTS_QUERY_KEY } from './queryKeys'

const queryClient = new QueryClient()

const loadAgentsInfo = () =>
  queryClient.fetchQuery({ queryKey: AGENTS_QUERY_KEY, queryFn: () => ({ isConfigured: true }) })

const isAgentsInfoInvalidated = () => queryClient.getQueryState(AGENTS_QUERY_KEY)?.isInvalidated

describe('invalidateAgentsIfNotConfigured', () => {
  afterEach(() => {
    queryClient.clear()
  })

  it('invalidates the agents info on 503 LLM_NOT_CONFIGURED', async () => {
    await loadAgentsInfo()

    await invalidateAgentsIfNotConfigured(
      queryClient,
      new ApiRequestError({ message: 'No LLM', status: 503, code: 'LLM_NOT_CONFIGURED' }),
    )

    expect(isAgentsInfoInvalidated()).toBe(true)
  })

  it('keeps the agents info on a rate limit', async () => {
    await loadAgentsInfo()

    await invalidateAgentsIfNotConfigured(
      queryClient,
      new ApiRequestError({ message: 'Slow down', status: 429, code: 'LLM_RATE_LIMITED' }),
    )

    expect(isAgentsInfoInvalidated()).toBe(false)
  })
})
