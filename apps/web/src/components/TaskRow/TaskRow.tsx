'use client'

import Link from 'next/link'
import { type FC, useId, useState } from 'react'

import type { TaskPriority, TaskStatus } from '@devlog/shared'

import { Badge } from '@/components/Badge/Badge'
import { SubtaskList } from '@/components/SubtaskList/SubtaskList'
import { TaskStatusControl } from '@/components/TaskStatusControl/TaskStatusControl'
import { PRIORITY_LABELS, PRIORITY_TONES } from '@/config/taskDisplay'

import styles from './TaskRow.module.scss'

type TaskRowProps = {
  id: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  subtaskCount: number
  subtaskDoneCount: number
}

const TaskRow: FC<TaskRowProps> = ({
  id,
  title,
  status,
  priority,
  subtaskCount,
  subtaskDoneCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const subtasksId = useId()

  const hasSubtasks = subtaskCount > 0

  return (
    <li className={styles.row}>
      <div className={styles.main}>
        {hasSubtasks ? (
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={isExpanded}
            aria-controls={subtasksId}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} subtasks of ${title}`}
            onClick={() => setIsExpanded((wasExpanded) => !wasExpanded)}
          >
            <span className={isExpanded ? styles.chevronOpen : styles.chevron} aria-hidden="true">
              ▸
            </span>
          </button>
        ) : (
          <span className={styles.toggleSpace} />
        )}
        <Link href={`/tasks/${id}`} className={styles.title}>
          {title}
        </Link>
        <span className={styles.key}>#{id}</span>
        {hasSubtasks && (
          <span className={styles.counter} title="Subtasks done">
            {subtaskDoneCount}/{subtaskCount}
          </span>
        )}
        <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>
        <TaskStatusControl
          taskId={id}
          title={title}
          status={status}
          openSubtaskCount={subtaskCount - subtaskDoneCount}
        />
      </div>
      {isExpanded && (
        <div id={subtasksId} className={styles.subtasks}>
          <SubtaskList parentId={id} />
        </div>
      )}
    </li>
  )
}

export { TaskRow }
