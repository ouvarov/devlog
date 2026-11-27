import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TASKS_QUERY_KEY } from '@/api/queryKeys'
import { updateTask } from '@/api/tasks'

const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  })
}

export { useUpdateTask }
