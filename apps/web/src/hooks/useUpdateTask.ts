import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateTasks } from '@/api/invalidateTasks'
import { updateTask } from '@/api/tasks'

const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => invalidateTasks(queryClient),
  })
}

export { useUpdateTask }
