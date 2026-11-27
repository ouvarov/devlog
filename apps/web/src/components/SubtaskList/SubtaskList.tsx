'use client'

import Link from 'next/link'
import type { FC } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { LoadError } from '@/components/LoadError/LoadError'
import { TaskStatusControl } from '@/components/TaskStatusControl/TaskStatusControl'
import { PRIORITY_LABELS, PRIORITY_TONES } from '@/config/taskDisplay'
import { useTask } from '@/hooks/useTask'

import styles from './SubtaskList.module.scss'

type SubtaskListProps = {
  parentId: number
}

const SubtaskList: FC<SubtaskListProps> = ({ parentId }) => {
  const { data: parent, isPending, error, refetch } = useTask(parentId)

  if (isPending) return <p className={styles.note}>Loading subtasks…</p>
  if (error) return <LoadError error={error} onRetry={() => void refetch()} />
  if (parent.subtasks.length === 0) return <p className={styles.note}>No subtasks yet.</p>

  return (
    <ul className={styles.list}>
      {parent.subtasks.map((subtask) => (
        <li key={subtask.id} className={styles.item}>
          <Link href={`/tasks/${subtask.id}`} className={styles.title}>
            {subtask.title}
          </Link>
          <span className={styles.key}>#{subtask.id}</span>
          <Badge tone={PRIORITY_TONES[subtask.priority]}>{PRIORITY_LABELS[subtask.priority]}</Badge>
          <TaskStatusControl
            taskId={subtask.id}
            title={subtask.title}
            status={subtask.status}
            openSubtaskCount={0}
          />
        </li>
      ))}
    </ul>
  )
}

export { SubtaskList }
