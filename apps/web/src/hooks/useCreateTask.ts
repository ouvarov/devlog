import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TASKS_QUERY_KEY } from '@/api/queryKeys'
import { createTask } from '@/api/tasks'

const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  })
}

export { useCreateTask }
