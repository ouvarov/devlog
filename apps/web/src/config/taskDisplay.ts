import type { TaskPriority, TaskSortField, TaskStatus } from '@devlog/shared'

import type { Tone } from '@/types/tone'

const STATUS_LABELS = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
} satisfies Record<TaskStatus, string>

const STATUS_TONES = {
  todo: 'neutral',
  'in-progress': 'info',
  done: 'success',
} satisfies Record<TaskStatus, Tone>

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} satisfies Record<TaskPriority, string>

const PRIORITY_TONES = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
} satisfies Record<TaskPriority, Tone>

const SORT_LABELS = {
  createdAt: 'Newest first',
  priority: 'Priority, high first',
} satisfies Record<TaskSortField, string>

export { PRIORITY_LABELS, PRIORITY_TONES, SORT_LABELS, STATUS_LABELS, STATUS_TONES }
