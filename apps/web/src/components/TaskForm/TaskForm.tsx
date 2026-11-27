'use client'

import { type FC, type FormEvent, useId, useState } from 'react'

import { TASK_PRIORITIES, TASK_STATUSES } from '@devlog/shared'

import { Button } from '@/components/Button/Button'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/config/taskDisplay'
import type { TaskFormErrors, TaskFormField, TaskFormValues } from '@/types/taskForm'
import { pickOption } from '@/utils/options'

import styles from './TaskForm.module.scss'

type TaskFormProps = {
  initialValues: TaskFormValues
  submitLabel: string
  onSubmit: (values: TaskFormValues) => Promise<TaskFormErrors | null>
  onCancel: () => void
}

const readFormValues = (form: HTMLFormElement): TaskFormValues => {
  const formData = new FormData(form)
  const readText = (field: TaskFormField): string => {
    const value = formData.get(field)
    return typeof value === 'string' ? value : ''
  }

  return {
    title: readText('title'),
    description: readText('description'),
    status: pickOption(TASK_STATUSES, formData.get('status')) ?? 'todo',
    priority: pickOption(TASK_PRIORITIES, formData.get('priority')) ?? 'medium',
  }
}

const TaskForm: FC<TaskFormProps> = ({ initialValues, submitLabel, onSubmit, onCancel }) => {
  const [errors, setErrors] = useState<TaskFormErrors | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formId = useId()

  const getFieldId = (field: TaskFormField) => `${formId}-${field}`
  const getErrorId = (field: TaskFormField) => `${formId}-${field}-error`
  const getFieldError = (field: TaskFormField) => errors?.fields[field]

  const getErrorProps = (field: TaskFormField) => ({
    'aria-invalid': getFieldError(field) ? true : undefined,
    'aria-describedby': getFieldError(field) ? getErrorId(field) : undefined,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = readFormValues(event.currentTarget)

    setIsSubmitting(true)
    const submitErrors = await onSubmit(values)
    setIsSubmitting(false)
    setErrors(submitErrors)
  }

  const renderFieldError = (field: TaskFormField) => {
    const fieldError = getFieldError(field)
    if (!fieldError) return null

    return (
      <p id={getErrorId(field)} className={styles.error}>
        {fieldError}
      </p>
    )
  }

  return (
    <form className={styles.form} noValidate onSubmit={(event) => void handleSubmit(event)}>
      <div className={styles.field}>
        <label htmlFor={getFieldId('title')}>Title</label>
        <input
          id={getFieldId('title')}
          name="title"
          className={styles.control}
          defaultValue={initialValues.title}
          autoFocus
          {...getErrorProps('title')}
        />
        {renderFieldError('title')}
      </div>

      <div className={styles.field}>
        <label htmlFor={getFieldId('description')}>Description</label>
        <textarea
          id={getFieldId('description')}
          name="description"
          className={styles.control}
          rows={5}
          defaultValue={initialValues.description}
          {...getErrorProps('description')}
        />
        {renderFieldError('description')}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={getFieldId('status')}>Status</label>
          <select
            id={getFieldId('status')}
            name="status"
            className={styles.control}
            defaultValue={initialValues.status}
            {...getErrorProps('status')}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {renderFieldError('status')}
        </div>

        <div className={styles.field}>
          <label htmlFor={getFieldId('priority')}>Priority</label>
          <select
            id={getFieldId('priority')}
            name="priority"
            className={styles.control}
            defaultValue={initialValues.priority}
            {...getErrorProps('priority')}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          {renderFieldError('priority')}
        </div>
      </div>

      {errors?.message && (
        <p className={styles.formError} role="alert">
          {errors.message}
        </p>
      )}

      <div className={styles.actions}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export { TaskForm }
