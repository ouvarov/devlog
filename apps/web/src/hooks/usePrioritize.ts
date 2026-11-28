import { useMutation } from '@tanstack/react-query'

import { runPrioritize } from '@/api/agents'
import type { PrioritizeRun } from '@/types/prioritizePlan'

const runAndStamp = async (): Promise<PrioritizeRun> => {
  const response = await runPrioritize()
  return { response, finishedAt: new Date().toISOString() }
}

const usePrioritize = () => useMutation({ mutationFn: runAndStamp })

export { usePrioritize }
