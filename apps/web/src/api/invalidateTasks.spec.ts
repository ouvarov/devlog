import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TASK_LIST_FILTERS } from '@/utils/taskListFilters'

import { invalidateTasks } from './invalidateTasks'
import { getTaskListKey } from './queryKeys'

const queryClient = new QueryClient()

describe('invalidateTasks', () => {
  afterEach(() => {
    queryClient.clear()
  })

  it('refetches a task list that no component is showing', async () => {
    const listTasks = vi.fn().mockResolvedValue([])
    await queryClient.fetchQuery({
      queryKey: getTaskListKey(DEFAULT_TASK_LIST_FILTERS),
      queryFn: listTasks,
    })

    await invalidateTasks(queryClient)

    expect(listTasks).toHaveBeenCalledTimes(2)
  })
})
