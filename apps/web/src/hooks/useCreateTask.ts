import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateTasks } from '@/api/invalidateTasks'
import { createTask } from '@/api/tasks'

const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => invalidateTasks(queryClient),
  })
}

export { useCreateTask }
