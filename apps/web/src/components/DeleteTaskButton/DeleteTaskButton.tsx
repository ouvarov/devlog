'use client'

import { useRouter } from 'next/navigation'
import type { FC } from 'react'

import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useDeleteTask } from '@/hooks/useDeleteTask'
import { pluralize } from '@/utils/text'

import styles from './DeleteTaskButton.module.scss'

type DeleteTaskButtonProps = {
  taskId: number
  title: string
  subtaskCount: number
  redirectTo: string
}

const getDeleteMessage = (title: string, subtaskCount: number): string =>
  subtaskCount > 0
    ? `“${title}” and its ${pluralize(subtaskCount, 'subtask')} will be deleted.`
    : `“${title}” will be deleted.`

const DeleteTaskButton: FC<DeleteTaskButtonProps> = ({
  taskId,
  title,
  subtaskCount,
  redirectTo,
}) => {
  const router = useRouter()
  const { mutate: deleteTask, isPending, error, reset } = useDeleteTask()
  const confirmation = useConfirmation()

  const handleDelete = async () => {
    reset()
    if (!(await confirmation.askConfirmation())) return
    deleteTask(taskId, { onSuccess: () => router.push(redirectTo) })
  }

  return (
    <>
      <Button variant="danger" onClick={() => void handleDelete()} disabled={isPending}>
        {isPending ? 'Deleting…' : 'Delete'}
      </Button>
      {error && (
        <span className={styles.error} role="alert">
          {error.message}
        </span>
      )}
      <ConfirmDialog
        isOpen={confirmation.isOpen}
        heading="Delete task?"
        message={getDeleteMessage(title, subtaskCount)}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmation.confirm}
        onCancel={confirmation.cancel}
      />
    </>
  )
}

export { DeleteTaskButton }
