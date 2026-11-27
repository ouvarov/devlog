'use client'

import type { ChangeEvent, FC } from 'react'

import { TASK_STATUSES, type TaskStatus } from '@devlog/shared'

import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { STATUS_LABELS, STATUS_TONES } from '@/config/taskDisplay'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useUpdateTask } from '@/hooks/useUpdateTask'
import { pickOption } from '@/utils/options'
import { needsDoneConfirmation } from '@/utils/taskStatus'
import { pluralize } from '@/utils/text'

import styles from './TaskStatusControl.module.scss'

type TaskStatusControlProps = {
  taskId: number
  title: string
  status: TaskStatus
  openSubtaskCount: number
}

const TaskStatusControl: FC<TaskStatusControlProps> = ({
  taskId,
  title,
  status,
  openSubtaskCount,
}) => {
  const { mutate: updateTask, isPending, variables, error, reset } = useUpdateTask()
  const confirmation = useConfirmation()

  const shownStatus = isPending ? (variables.changes.status ?? status) : status

  const changeStatus = async (nextStatus: TaskStatus) => {
    reset()
    const isConfirmed =
      !needsDoneConfirmation(nextStatus, openSubtaskCount) || (await confirmation.askConfirmation())
    if (isConfirmed) updateTask({ id: taskId, changes: { status: nextStatus } })
  }

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = pickOption(TASK_STATUSES, event.target.value)
    if (nextStatus && !isPending) void changeStatus(nextStatus)
  }

  return (
    <>
      <select
        className={`${styles.select} ${styles[STATUS_TONES[shownStatus]]}`}
        value={shownStatus}
        onChange={handleChange}
        aria-busy={isPending}
        aria-label={`Status of ${title}`}
      >
        {TASK_STATUSES.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      {error && (
        <span className={styles.error} role="alert">
          {error.message}
        </span>
      )}
      <ConfirmDialog
        isOpen={confirmation.isOpen}
        heading="Mark as done?"
        message={`“${title}” still has ${pluralize(openSubtaskCount, 'open subtask')}. Mark it as done anyway?`}
        confirmLabel="Mark as done"
        onConfirm={confirmation.confirm}
        onCancel={confirmation.cancel}
      />
    </>
  )
}

export { TaskStatusControl }
