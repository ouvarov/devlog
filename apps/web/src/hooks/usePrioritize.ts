import { useMutation, useQueryClient } from '@tanstack/react-query'

import { runPrioritize } from '@/api/agents'
import { invalidateAgentsIfNotConfigured } from '@/api/invalidateAgents'
import type { PrioritizeRun } from '@/types/prioritizePlan'

const runAndStamp = async (): Promise<PrioritizeRun> => {
  const response = await runPrioritize()
  return { response, finishedAt: new Date().toISOString() }
}

const usePrioritize = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: runAndStamp,
    onError: (error) => invalidateAgentsIfNotConfigured(queryClient, error),
  })
}

export { usePrioritize }
