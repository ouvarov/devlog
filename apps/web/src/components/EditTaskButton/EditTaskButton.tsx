'use client'

import { type FC, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Dialog } from '@/components/Dialog/Dialog'
import { TaskForm } from '@/components/TaskForm/TaskForm'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useUpdateTask } from '@/hooks/useUpdateTask'
import type { TaskFormValues } from '@/types/taskForm'
import { getSubmitErrors, toUpdateTaskChanges } from '@/utils/taskForm'
import { needsDoneConfirmation } from '@/utils/taskStatus'
import { pluralize } from '@/utils/text'

type EditTaskButtonProps = TaskFormValues & {
  taskId: number
  openSubtaskCount: number
}

const EditTaskButton: FC<EditTaskButtonProps> = ({
  taskId,
  openSubtaskCount,
  title,
  description,
  status,
  priority,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { mutateAsync: updateTask } = useUpdateTask()
  const confirmation = useConfirmation()

  const initialValues: TaskFormValues = { title, description, status, priority }

  const handleSubmit = async (values: TaskFormValues) => {
    const changes = toUpdateTaskChanges(initialValues, values)
    if (!changes.success) return changes.errors

    const isConfirmed =
      !needsDoneConfirmation(changes.data.status, openSubtaskCount) ||
      (await confirmation.askConfirmation())
    if (!isConfirmed) return null

    try {
      await updateTask({ id: taskId, changes: changes.data })
      setIsOpen(false)
      return null
    } catch (error) {
      return getSubmitErrors(error)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Edit</Button>
      <Dialog isOpen={isOpen} heading="Edit task" onClose={() => setIsOpen(false)}>
        <TaskForm
          initialValues={initialValues}
          submitLabel="Save"
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
        />
      </Dialog>
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

export { EditTaskButton }
