import { describe, expect, it } from 'vitest'

import { needsDoneConfirmation } from './taskStatus'

describe('needsDoneConfirmation', () => {
  it('asks when a task with open subtasks moves to done', () => {
    expect(needsDoneConfirmation('done', 2)).toBe(true)
  })

  it('does not ask when no subtask is open', () => {
    expect(needsDoneConfirmation('done', 0)).toBe(false)
  })

  it('does not ask for any other status or no status change', () => {
    expect(needsDoneConfirmation('in-progress', 2)).toBe(false)
    expect(needsDoneConfirmation('todo', 2)).toBe(false)
    expect(needsDoneConfirmation(undefined, 2)).toBe(false)
  })
})
