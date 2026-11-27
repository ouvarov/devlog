import { describe, expect, it } from 'vitest'

import type { TaskView } from '@devlog/shared'

import { buildFallbackPlan, scoreTask } from './prioritize-fallback.js'

const NOW = new Date('2026-11-27T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

const taskWith = (
  overrides: Partial<TaskView> & Pick<TaskView, 'id'>,
  createdDaysAgo = 0,
): TaskView => {
  const createdAt = new Date(NOW.getTime() - createdDaysAgo * DAY_MS).toISOString()
  return {
    title: `Task ${overrides.id}`,
    description: '',
    status: 'todo',
    priority: 'medium',
    parentId: null,
    subtaskCount: 0,
    subtaskDoneCount: 0,
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
    ...overrides,
  }
}

describe('scoreTask', () => {
  it('adds a bonus of 2 for a task in progress', () => {
    const todo = scoreTask({ priority: 'medium', status: 'todo', ageDays: 0 })
    const inProgress = scoreTask({ priority: 'medium', status: 'in-progress', ageDays: 0 })

    expect(todo).toBe(2)
    expect(inProgress).toBe(4)
  })

  it('counts age up to 14 days only', () => {
    const twoWeeksOld = scoreTask({ priority: 'low', status: 'todo', ageDays: 14 })
    const twoMonthsOld = scoreTask({ priority: 'low', status: 'todo', ageDays: 60 })

    expect(twoWeeksOld).toBe(3)
    expect(twoMonthsOld).toBe(twoWeeksOld)
  })

  it('ranks a medium task waiting two weeks above a high task created today', () => {
    const oldMedium = scoreTask({ priority: 'medium', status: 'todo', ageDays: 14 })
    const freshHigh = scoreTask({ priority: 'high', status: 'todo', ageDays: 0 })

    expect(oldMedium).toBeGreaterThan(freshHigh)
  })
})

describe('buildFallbackPlan', () => {
  const openTasks = [
    taskWith({ id: 1, priority: 'high' }, 0),
    taskWith({ id: 2, priority: 'medium' }, 14),
    taskWith({ id: 3, priority: 'low', status: 'in-progress' }, 0),
    taskWith({ id: 4, priority: 'medium' }, 20),
    taskWith({ id: 5, priority: 'low' }, 7),
    taskWith({ id: 6, priority: 'high', status: 'in-progress' }, 7),
  ]

  it('puts the top 5 by score in focus and the rest in later', () => {
    const plan = buildFallbackPlan(openTasks, 'rate-limited', NOW)

    expect(plan.focus.map(({ taskId }) => taskId)).toEqual([6, 4, 2, 1, 3])
    expect(plan.later).toEqual([5])
  })

  it('explains each focus task and the fallback reason in English', () => {
    const plan = buildFallbackPlan(openTasks, 'timeout', NOW)

    expect(plan.focus[0]?.reason).toBe('high priority, already in progress, open 7 days (score 8.0)')
    expect(plan.summary).toContain('the model did not answer in time')
  })

  it('puts every task in focus when fewer than 5 are open', () => {
    const plan = buildFallbackPlan(openTasks.slice(0, 2), 'llm-error', NOW)

    expect(plan.focus).toHaveLength(2)
    expect(plan.later).toEqual([])
  })
})
