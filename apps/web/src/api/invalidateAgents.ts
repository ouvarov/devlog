import type { QueryClient } from '@tanstack/react-query'

import { ApiRequestError } from './client'
import { AGENTS_QUERY_KEY } from './queryKeys'

const isLlmNotConfigured = (error: Error): boolean =>
  error instanceof ApiRequestError && error.code === 'LLM_NOT_CONFIGURED'

const invalidateAgentsIfNotConfigured = async (
  queryClient: QueryClient,
  error: Error,
): Promise<void> => {
  if (isLlmNotConfigured(error)) await queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY })
}

export { invalidateAgentsIfNotConfigured }
