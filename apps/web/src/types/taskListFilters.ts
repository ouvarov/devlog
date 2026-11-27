import type { TaskSortField, TaskStatus } from '@devlog/shared'

type TaskListFilters = {
  status: TaskStatus | null
  sort: TaskSortField
}

export type { TaskListFilters }
