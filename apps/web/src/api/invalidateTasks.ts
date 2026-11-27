import type { QueryClient } from '@tanstack/react-query'

import { TASKS_QUERY_KEY } from './queryKeys'

// 'all' refetches the lists and details no page shows right now, so navigating back never paints stale tasks.
const invalidateTasks = (queryClient: QueryClient): Promise<void> =>
  queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY, refetchType: 'all' })

export { invalidateTasks }
