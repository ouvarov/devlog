import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateTasks } from '@/api/invalidateTasks'
import { createTasksBatch } from '@/api/tasks'

const useCreateTasksBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTasksBatch,
    onSuccess: () => invalidateTasks(queryClient),
  })
}

export { useCreateTasksBatch }
