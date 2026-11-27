'use client'

import Link from 'next/link'
import type { FC } from 'react'

import { AddTaskButton } from '@/components/AddTaskButton/AddTaskButton'
import { Badge } from '@/components/Badge/Badge'
import { DeleteTaskButton } from '@/components/DeleteTaskButton/DeleteTaskButton'
import { EditTaskButton } from '@/components/EditTaskButton/EditTaskButton'
import { LoadError } from '@/components/LoadError/LoadError'
import { SubtaskList } from '@/components/SubtaskList/SubtaskList'
import { TaskStatusControl } from '@/components/TaskStatusControl/TaskStatusControl'
import { PRIORITY_LABELS, PRIORITY_TONES } from '@/config/taskDisplay'
import { useTask } from '@/hooks/useTask'
import { formatDateTime } from '@/utils/date'

import styles from './TaskDetails.module.scss'

type TaskDetailsProps = {
  taskId: number
}

const TaskDetails: FC<TaskDetailsProps> = ({ taskId }) => {
  const { data: task, isPending, error, refetch } = useTask(taskId)

  if (isPending) return <p className={styles.note}>Loading task…</p>
  if (error) {
    return (
      <div className={styles.details}>
        <Link href="/" className={styles.back}>
          ← All tasks
        </Link>
        <LoadError error={error} onRetry={() => void refetch()} />
      </div>
    )
  }

  const openSubtaskCount = task.subtaskCount - task.subtaskDoneCount
  const backHref = task.parent ? `/tasks/${task.parent.id}` : '/'

  return (
    <article className={styles.details}>
      <Link href={backHref} className={styles.back}>
        {task.parent ? `← Parent: ${task.parent.title}` : '← All tasks'}
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>
          {task.title} <span className={styles.key}>#{task.id}</span>
        </h1>
        <div className={styles.actions}>
          <EditTaskButton
            taskId={task.id}
            openSubtaskCount={openSubtaskCount}
            title={task.title}
            description={task.description}
            status={task.status}
            priority={task.priority}
          />
          <DeleteTaskButton
            taskId={task.id}
            title={task.title}
            subtaskCount={task.subtaskCount}
            redirectTo={backHref}
          />
        </div>
      </header>

      <div className={styles.meta}>
        <TaskStatusControl
          taskId={task.id}
          title={task.title}
          status={task.status}
          openSubtaskCount={openSubtaskCount}
        />
        <Badge tone={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
      </div>

      {task.description ? (
        <p className={styles.description}>{task.description}</p>
      ) : (
        <p className={styles.note}>No description.</p>
      )}

      <dl className={styles.dates}>
        <dt>Created</dt>
        <dd>{formatDateTime(task.createdAt)}</dd>
        <dt>Updated</dt>
        <dd>{formatDateTime(task.updatedAt)}</dd>
        {task.completedAt && (
          <>
            <dt>Completed</dt>
            <dd>{formatDateTime(task.completedAt)}</dd>
          </>
        )}
      </dl>

      {!task.parent && (
        <section className={styles.subtasks}>
          <div className={styles.subtasksHeader}>
            <h2 className={styles.subtasksTitle}>
              Subtasks{' '}
              <span className={styles.key}>
                {task.subtaskDoneCount}/{task.subtaskCount}
              </span>
            </h2>
            {task.status !== 'done' && <AddTaskButton parentId={task.id} />}
          </div>
          <SubtaskList parentId={task.id} />
        </section>
      )}
    </article>
  )
}

export { TaskDetails }
