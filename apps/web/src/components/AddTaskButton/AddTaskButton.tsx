'use client'

import { type FC, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Dialog } from '@/components/Dialog/Dialog'
import { TaskForm } from '@/components/TaskForm/TaskForm'
import { useCreateTask } from '@/hooks/useCreateTask'
import type { TaskFormValues } from '@/types/taskForm'
import { EMPTY_TASK_FORM, getSubmitErrors, toCreateTaskInput } from '@/utils/taskForm'

type AddTaskButtonProps = {
  parentId?: number
}

const AddTaskButton: FC<AddTaskButtonProps> = ({ parentId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { mutateAsync: createTask } = useCreateTask()

  const isSubtask = parentId !== undefined
  const label = isSubtask ? 'Add subtask' : 'New task'

  const handleSubmit = async (values: TaskFormValues) => {
    const input = toCreateTaskInput(values, parentId)
    if (!input.success) return input.errors

    try {
      await createTask(input.data)
      setIsOpen(false)
      return null
    } catch (error) {
      return getSubmitErrors(error)
    }
  }

  return (
    <>
      <Button variant={isSubtask ? 'secondary' : 'primary'} onClick={() => setIsOpen(true)}>
        {label}
      </Button>
      <Dialog
        isOpen={isOpen}
        heading={isSubtask ? 'New subtask' : 'New task'}
        onClose={() => setIsOpen(false)}
      >
        <TaskForm
          initialValues={EMPTY_TASK_FORM}
          submitLabel="Create"
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
        />
      </Dialog>
    </>
  )
}

export { AddTaskButton }
