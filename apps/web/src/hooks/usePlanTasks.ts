import { useQueries } from '@tanstack/react-query'

import { getTaskKey } from '@/api/queryKeys'
import { getTask } from '@/api/tasks'
import { useTasks } from '@/hooks/useTasks'
import type { PlanTaskRefs } from '@/types/prioritizePlan'
import { getPlanTaskRefs, getUnlistedIds } from '@/utils/prioritizePlan'
import { DEFAULT_TASK_LIST_FILTERS } from '@/utils/taskListFilters'

const usePlanTasks = (taskIds: readonly number[]): PlanTaskRefs => {
  const { data: listedTasks, isError: hasListFailed } = useTasks(DEFAULT_TASK_LIST_FILTERS)

  const unlistedIds = getUnlistedIds(taskIds, listedTasks, hasListFailed)

  const lookups = useQueries({
    queries: unlistedIds.map((id) => ({
      queryKey: getTaskKey(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getTask(id, signal),
    })),
  })

  return getPlanTaskRefs(
    taskIds,
    listedTasks,
    new Map(unlistedIds.map((id, index) => [id, lookups[index]])),
  )
}

export { usePlanTasks }
