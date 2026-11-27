import { useQuery } from '@tanstack/react-query'

import { getTaskListKey } from '@/api/queryKeys'
import { listTasks } from '@/api/tasks'
import type { TaskListFilters } from '@/types/taskListFilters'

const useTasks = (filters: TaskListFilters) =>
  useQuery({
    queryKey: getTaskListKey(filters),
    queryFn: ({ signal }) => listTasks(filters, signal),
  })

export { useTasks }
