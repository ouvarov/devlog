import { useMutation, useQueryClient } from '@tanstack/react-query'

import { runPrioritize } from '@/api/agents'
import { ApiRequestError } from '@/api/client'
import { AGENTS_QUERY_KEY } from '@/api/queryKeys'
import type { PrioritizeRun } from '@/types/prioritizePlan'

const runAndStamp = async (): Promise<PrioritizeRun> => {
  const response = await runPrioritize()
  return { response, finishedAt: new Date().toISOString() }
}

const isLlmNotConfigured = (error: Error): boolean =>
  error instanceof ApiRequestError && error.code === 'LLM_NOT_CONFIGURED'

const usePrioritize = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: runAndStamp,
    onError: async (error) => {
      if (isLlmNotConfigured(error))
        await queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY })
    },
  })
}

export { usePrioritize }
