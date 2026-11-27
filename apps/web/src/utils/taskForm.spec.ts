import { describe, expect, it } from 'vitest'

import { ApiRequestError } from '@/api/client'
import type { TaskFormValues } from '@/types/taskForm'

import {
  EMPTY_TASK_FORM,
  getSubmitErrors,
  toCreateTaskInput,
  toFormErrors,
  toUpdateTaskChanges,
} from './taskForm'

const createFormValues = (overrides: Partial<TaskFormValues> = {}): TaskFormValues => ({
  ...EMPTY_TASK_FORM,
  title: 'Write docs',
  ...overrides,
})

describe('toFormErrors', () => {
  it('puts an issue under the field named by its path', () => {
    expect(toFormErrors([{ path: ['title'], message: 'Title taken' }])).toEqual({
      fields: { title: 'Title taken' },
      message: null,
    })
  })

  it('moves an issue without a form field into the form message', () => {
    expect(
      toFormErrors([
        { path: [], message: 'At least one field must be changed' },
        { path: ['parentId'], message: 'Unrecognized field' },
      ]),
    ).toEqual({
      fields: {},
      message: 'At least one field must be changed. Unrecognized field',
    })
  })

  it('keeps the first message when a field has several issues', () => {
    expect(
      toFormErrors([
        { path: ['title'], message: 'First' },
        { path: ['title'], message: 'Second' },
      ]).fields,
    ).toEqual({ title: 'First' })
  })
})

describe('getSubmitErrors', () => {
  it('maps server issues to fields', () => {
    const error = new ApiRequestError({
      message: 'Validation failed',
      status: 400,
      code: 'VALIDATION_FAILED',
      issues: [{ path: ['description'], message: 'Too long' }],
    })

    expect(getSubmitErrors(error)).toEqual({ fields: { description: 'Too long' }, message: null })
  })

  it('shows the server message when the error has no issues', () => {
    const error = new ApiRequestError({
      message: 'Task 3 is done and cannot get new subtasks',
      status: 400,
      code: 'BAD_REQUEST',
    })

    expect(getSubmitErrors(error)).toEqual({
      fields: {},
      message: 'Task 3 is done and cannot get new subtasks',
    })
  })

  it('shows a generic message for an unknown error', () => {
    expect(getSubmitErrors(new Error('boom')).message).toBe('Something went wrong. Try again.')
  })
})

describe('toCreateTaskInput', () => {
  it('rejects an empty title with a field error', () => {
    const result = toCreateTaskInput(createFormValues({ title: '   ' }))

    expect(result).toEqual({
      success: false,
      errors: { fields: { title: 'This field is required' }, message: null },
    })
  })

  it('adds the parent id from the caller', () => {
    const result = toCreateTaskInput(createFormValues(), 7)

    expect(result.success && result.data).toMatchObject({ title: 'Write docs', parentId: 7 })
  })
})

describe('toUpdateTaskChanges', () => {
  it('sends only the fields that changed', () => {
    const initialValues = createFormValues()

    const result = toUpdateTaskChanges(initialValues, { ...initialValues, priority: 'high' })

    expect(result).toEqual({ success: true, data: { priority: 'high' } })
  })

  it('returns no changes when nothing changed', () => {
    const initialValues = createFormValues()

    expect(toUpdateTaskChanges(initialValues, initialValues)).toEqual({ success: true, data: null })
  })

  it('treats whitespace around the title and description as no change', () => {
    const initialValues = createFormValues({ description: 'Notes' })

    const result = toUpdateTaskChanges(initialValues, {
      ...initialValues,
      title: '  Write docs ',
      description: 'Notes\n',
    })

    expect(result).toEqual({ success: true, data: null })
  })
})
