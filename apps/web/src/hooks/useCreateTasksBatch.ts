import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateTasks } from '@/api/invalidateTasks'
import { createTasksBatch } from '@/api/tasks'

const getCreateTasksBatchOptions = (queryClient: QueryClient) => ({
  mutationFn: createTasksBatch,
  onSuccess: () => invalidateTasks(queryClient),
})

const useCreateTasksBatch = () => {
  const queryClient = useQueryClient()

  return useMutation(getCreateTasksBatchOptions(queryClient))
}

export { getCreateTasksBatchOptions, useCreateTasksBatch }
