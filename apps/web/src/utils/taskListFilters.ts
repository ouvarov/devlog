import { TASK_SORT_FIELDS, TASK_STATUSES } from '@devlog/shared'

import type { TaskListFilters } from '@/types/taskListFilters'

import { pickOption } from './options'

type SearchParamsReader = {
  get: (name: string) => string | null
}

const DEFAULT_TASK_LIST_FILTERS: TaskListFilters = { status: null, sort: 'createdAt' }

const parseTaskListFilters = (params: SearchParamsReader): TaskListFilters => ({
  status: pickOption(TASK_STATUSES, params.get('status')) ?? DEFAULT_TASK_LIST_FILTERS.status,
  sort: pickOption(TASK_SORT_FIELDS, params.get('sort')) ?? DEFAULT_TASK_LIST_FILTERS.sort,
})

const toTaskListSearch = ({ status, sort }: TaskListFilters): string => {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (sort !== DEFAULT_TASK_LIST_FILTERS.sort) params.set('sort', sort)

  const query = params.toString()
  return query ? `?${query}` : ''
}

export { DEFAULT_TASK_LIST_FILTERS, parseTaskListFilters, toTaskListSearch }
