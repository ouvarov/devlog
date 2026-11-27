import { useQuery } from '@tanstack/react-query'

import { getTaskKey } from '@/api/queryKeys'
import { getTask } from '@/api/tasks'

const useTask = (id: number) =>
  useQuery({
    queryKey: getTaskKey(id),
    queryFn: ({ signal }) => getTask(id, signal),
  })

export { useTask }
