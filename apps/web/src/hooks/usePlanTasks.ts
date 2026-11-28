import { useQueries } from '@tanstack/react-query'

import type { TaskView } from '@devlog/shared'

import { getTaskKey } from '@/api/queryKeys'
import { getTask } from '@/api/tasks'
import { useTasks } from '@/hooks/useTasks'
import type { KnownTasks } from '@/types/prioritizePlan'
import { toKnownTasks } from '@/utils/prioritizePlan'
import { DEFAULT_TASK_LIST_FILTERS } from '@/utils/taskListFilters'

const usePlanTasks = (taskIds: readonly number[]): KnownTasks => {
  const { data: listedTasks } = useTasks(DEFAULT_TASK_LIST_FILTERS)

  const listedIds = new Set(listedTasks?.map(({ id }) => id))
  const unlistedIds = listedTasks ? taskIds.filter((id) => !listedIds.has(id)) : []

  const fetchedTasks = useQueries({
    queries: unlistedIds.map((id) => ({
      queryKey: getTaskKey(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getTask(id, signal),
    })),
    combine: (results) => results.flatMap(({ data }): TaskView[] => (data ? [data] : [])),
  })

  return toKnownTasks([...(listedTasks ?? []), ...fetchedTasks])
}

export { usePlanTasks }
