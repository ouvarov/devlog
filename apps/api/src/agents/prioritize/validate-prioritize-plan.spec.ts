import { describe, expect, it } from 'vitest'

import type { TaskView } from '@devlog/shared'

import { validatePrioritizePlan } from './validate-prioritize-plan.js'

const CREATED_AT = '2026-11-20T10:00:00.000Z'

const openTask = (id: number): TaskView => ({
  id,
  title: `Task ${id}`,
  description: '',
  status: 'todo',
  priority: 'medium',
  parentId: null,
  subtaskCount: 0,
  subtaskDoneCount: 0,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  completedAt: null,
})

const OPEN_TASKS = [1, 2, 3, 4, 5].map(openTask)

const focusOf = (...taskIds: number[]) => taskIds.map((taskId) => ({ taskId, reason: 'Why' }))

describe('validatePrioritizePlan', () => {
  it('accepts 3 open tasks in focus and the others in later', () => {
    const plan = { focus: focusOf(1, 2, 3), later: [4, 5], summary: 'Plan' }

    expect(validatePrioritizePlan(plan, OPEN_TASKS)).toEqual({ accepted: true, value: plan })
  })

  it('rejects an id that is not an open task', () => {
    const result = validatePrioritizePlan(
      { focus: focusOf(1, 2, 42), later: [], summary: 'Plan' },
      OPEN_TASKS,
    )

    expect(result).toEqual({ accepted: false, errors: ['Task 42 does not exist or is done'] })
  })

  it('rejects a task listed in both focus and later', () => {
    const result = validatePrioritizePlan(
      { focus: focusOf(1, 2, 3), later: [3], summary: 'Plan' },
      OPEN_TASKS,
    )

    expect(result).toEqual({ accepted: false, errors: ['Task 3 is listed more than once'] })
  })

  it('rejects fewer than 3 focus tasks when 3 or more are open', () => {
    const result = validatePrioritizePlan(
      { focus: focusOf(1, 2), later: [], summary: 'Plan' },
      OPEN_TASKS,
    )

    expect(result).toEqual({ accepted: false, errors: ['focus must have 3 to 5 tasks, got 2'] })
  })

  it('accepts a smaller focus when fewer than 3 tasks are open', () => {
    const plan = { focus: focusOf(1, 2), later: [], summary: 'Plan' }

    expect(validatePrioritizePlan(plan, OPEN_TASKS.slice(0, 2)).accepted).toBe(true)
  })

  it('rejects a focus that leaves out one of 2 open tasks', () => {
    const result = validatePrioritizePlan(
      { focus: focusOf(1), later: [2], summary: 'Plan' },
      OPEN_TASKS.slice(0, 2),
    )

    expect(result).toEqual({ accepted: false, errors: ['focus must list all 2 open tasks'] })
  })

  it('rejects a reason over 200 and a summary over 400 characters', () => {
    const result = validatePrioritizePlan(
      {
        focus: [{ taskId: 1, reason: 'r'.repeat(201) }, ...focusOf(2, 3)],
        later: [],
        summary: 's'.repeat(401),
      },
      OPEN_TASKS,
    )

    expect(result.accepted).toBe(false)
    expect(result.accepted ? [] : result.errors.map((error) => error.split(':')[0])).toEqual([
      'focus.0.reason',
      'summary',
    ])
  })
})
