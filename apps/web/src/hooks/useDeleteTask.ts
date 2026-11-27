import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateTasks } from '@/api/invalidateTasks'
import { getTaskKey } from '@/api/queryKeys'
import { deleteTask } from '@/api/tasks'

const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_, id) => {
      // Removed before the invalidation, otherwise the open details page refetches its own 404.
      queryClient.removeQueries({ queryKey: getTaskKey(id) })
      return invalidateTasks(queryClient)
    },
  })
}

export { useDeleteTask }
