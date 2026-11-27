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
  const [openedValues, setOpenedValues] = useState<TaskFormValues | null>(null)
  const { mutateAsync: updateTask } = useUpdateTask()
  const confirmation = useConfirmation()

  const handleOpen = () => setOpenedValues({ title, description, status, priority })
  const handleClose = () => setOpenedValues(null)

  const handleSubmit = async (values: TaskFormValues) => {
    if (!openedValues) return null

    const changes = toUpdateTaskChanges(openedValues, values)
    if (!changes.success) return changes.errors
    if (!changes.data) {
      handleClose()
      return null
    }

    const isConfirmed =
      !needsDoneConfirmation(changes.data.status, openSubtaskCount) ||
      (await confirmation.askConfirmation())
    if (!isConfirmed) return null

    try {
      await updateTask({ id: taskId, changes: changes.data })
      handleClose()
      return null
    } catch (error) {
      return getSubmitErrors(error)
    }
  }

  return (
    <>
      <Button onClick={handleOpen}>Edit</Button>
      <Dialog isOpen={openedValues !== null} heading="Edit task" onClose={handleClose}>
        {openedValues && (
          <TaskForm
            initialValues={openedValues}
            submitLabel="Save"
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        )}
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
