import type { TaskListFilters } from '@/types/taskListFilters'

const TASKS_QUERY_KEY = ['tasks'] as const
const HEALTH_QUERY_KEY = ['health'] as const
const AGENTS_QUERY_KEY = ['agents'] as const

const getTaskListKey = (filters: TaskListFilters) => [...TASKS_QUERY_KEY, filters] as const

const getTaskKey = (id: number) => [...TASKS_QUERY_KEY, id] as const

export { AGENTS_QUERY_KEY, getTaskKey, getTaskListKey, HEALTH_QUERY_KEY, TASKS_QUERY_KEY }
