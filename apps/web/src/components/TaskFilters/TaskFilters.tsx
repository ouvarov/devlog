'use client'

import { type ChangeEvent, type FC, useId } from 'react'

import { TASK_SORT_FIELDS, TASK_STATUSES } from '@devlog/shared'

import { SORT_LABELS, STATUS_LABELS } from '@/config/taskDisplay'
import type { TaskListFilters } from '@/types/taskListFilters'
import { pickOption } from '@/utils/options'

import styles from './TaskFilters.module.scss'

type TaskFiltersProps = {
  filters: TaskListFilters
  onChange: (filters: TaskListFilters) => void
}

const ALL_STATUSES = 'all'

const TaskFilters: FC<TaskFiltersProps> = ({ filters, onChange }) => {
  const statusId = useId()
  const sortId = useId()

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, status: pickOption(TASK_STATUSES, event.target.value) ?? null })

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, sort: pickOption(TASK_SORT_FIELDS, event.target.value) ?? filters.sort })

  return (
    <div className={styles.filters}>
      <div className={styles.filter}>
        <label htmlFor={statusId}>Status</label>
        <select
          id={statusId}
          className={styles.select}
          value={filters.status ?? ALL_STATUSES}
          onChange={handleStatusChange}
        >
          <option value={ALL_STATUSES}>All</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filter}>
        <label htmlFor={sortId}>Sort</label>
        <select
          id={sortId}
          className={styles.select}
          value={filters.sort}
          onChange={handleSortChange}
        >
          {TASK_SORT_FIELDS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export { TaskFilters }
