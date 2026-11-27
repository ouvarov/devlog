'use client'

import type { FC } from 'react'

import { LoadError } from '@/components/LoadError/LoadError'
import { TaskRow } from '@/components/TaskRow/TaskRow'
import { STATUS_LABELS } from '@/config/taskDisplay'
import { useTasks } from '@/hooks/useTasks'
import type { TaskListFilters } from '@/types/taskListFilters'

import styles from './TaskList.module.scss'

type TaskListProps = {
  filters: TaskListFilters
}

const getEmptyMessage = ({ status }: TaskListFilters): string =>
  status
    ? `No tasks with status “${STATUS_LABELS[status]}”.`
    : 'No tasks yet. Create the first one.'

const TaskList: FC<TaskListProps> = ({ filters }) => {
  const { data: tasks, isPending, error, refetch } = useTasks(filters)

  if (isPending) return <p className={styles.note}>Loading tasks…</p>
  if (error) return <LoadError error={error} onRetry={() => void refetch()} />
  if (tasks.length === 0) return <p className={styles.note}>{getEmptyMessage(filters)}</p>

  return (
    <ul className={styles.list}>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          id={task.id}
          title={task.title}
          status={task.status}
          priority={task.priority}
          subtaskCount={task.subtaskCount}
          subtaskDoneCount={task.subtaskDoneCount}
        />
      ))}
    </ul>
  )
}

export { TaskList }
