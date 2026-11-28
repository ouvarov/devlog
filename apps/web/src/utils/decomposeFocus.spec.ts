import { describe, expect, it } from 'vitest'

import { CLARIFY_RESPONSE } from '@/fixtures/decomposeResponse'

import { getFormErrors, getPhaseFocus, getPhaseGroup } from './decomposeFocus'
import { IDLE_STATE, decomposeReducer } from './decomposeState'

const clarify = decomposeReducer(
  decomposeReducer(IDLE_STATE, { type: 'started', request: { taskId: 4 }, startedAt: 1 }),
  { type: 'answered', response: CLARIFY_RESPONSE },
)

describe('getPhaseFocus', () => {
  it('leaves the first phase to showModal', () => {
    expect(getPhaseFocus('idle', false)).toBe('none')
  })

  it('moves focus to each later phase', () => {
    for (const phase of ['running', 'clarify', 'proposal', 'creating', 'done', 'error'] as const) {
      expect(getPhaseFocus(phase, false)).toBe('phase')
    }
  })

  it('moves focus to the first invalid field when a form has errors', () => {
    expect(getPhaseFocus('proposal', true)).toBe('invalid')
    expect(getPhaseFocus('clarify', true)).toBe('invalid')
  })
})

describe('getFormErrors', () => {
  it('returns the answer errors of clarify and nothing for other phases', () => {
    const errors = { answers: { 0: 'Required' }, message: 'Answer them' }

    expect(getFormErrors(decomposeReducer(clarify, { type: 'answers-invalid', errors }))).toBe(
      errors,
    )
    expect(getFormErrors(clarify)).toBeNull()
    expect(getFormErrors(IDLE_STATE)).toBeNull()
  })
})

describe('getPhaseGroup', () => {
  it('keeps creating in the proposal group so the list is not remounted', () => {
    expect(getPhaseGroup('creating')).toBe('proposal')
    expect(getPhaseGroup('clarify')).toBe('clarify')
  })
})
