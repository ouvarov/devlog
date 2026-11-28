import { describe, expect, it } from 'vitest'

import { CLARIFY_RESPONSE, PROPOSAL_RESPONSE } from '@/fixtures/decomposeResponse'
import type { DecomposeErrorView, DecomposeState } from '@/types/decompose'

import { IDLE_STATE, decomposeReducer, toDraftItems } from './decomposeState'

const START_REQUEST = { taskId: 4 }
const STARTED_AT = 1000
const ERROR: DecomposeErrorView = {
  title: 'The agent did not finish',
  message: 'Step limit',
  trace: [],
  canRetry: true,
}

const runningState = (): DecomposeState =>
  decomposeReducer(IDLE_STATE, { type: 'started', request: START_REQUEST, startedAt: STARTED_AT })

const proposalState = (): DecomposeState =>
  decomposeReducer(runningState(), { type: 'answered', response: PROPOSAL_RESPONSE })

const creatingState = (): DecomposeState =>
  decomposeReducer(proposalState(), { type: 'create-started' })

describe('decomposeReducer', () => {
  it('starts a run from idle with the request and start time', () => {
    expect(runningState()).toEqual({
      phase: 'running',
      request: START_REQUEST,
      startedAt: STARTED_AT,
    })
  })

  it('moves to clarify with the questions and the run details', () => {
    const state = decomposeReducer(runningState(), { type: 'answered', response: CLARIFY_RESPONSE })

    expect(state).toEqual({
      phase: 'clarify',
      questions: CLARIFY_RESPONSE.kind === 'clarify' ? CLARIFY_RESPONSE.questions : [],
      run: { meta: CLARIFY_RESPONSE.meta, trace: CLARIFY_RESPONSE.trace },
    })
  })

  it('moves to a proposal with every item ticked', () => {
    const state = proposalState()

    expect(state.phase).toBe('proposal')
    if (state.phase !== 'proposal') return
    expect(state.items.map(({ isIncluded }) => isIncluded)).toEqual([true, true, true])
    expect(state.assumptions).toEqual(['The web app only, not mobile.'])
    expect(state.errors).toBeNull()
  })

  it('keeps the failed request so Try again can resend it', () => {
    const state = decomposeReducer(runningState(), { type: 'failed', error: ERROR })

    expect(state).toEqual({ phase: 'error', error: ERROR, request: START_REQUEST })
  })

  it('starts again from clarify and from an error', () => {
    const clarify = decomposeReducer(runningState(), {
      type: 'answered',
      response: CLARIFY_RESPONSE,
    })
    const error = decomposeReducer(runningState(), { type: 'failed', error: ERROR })
    const request = { taskId: 4, skipClarification: true }

    for (const state of [clarify, error]) {
      expect(decomposeReducer(state, { type: 'started', request, startedAt: 2 }).phase).toBe(
        'running',
      )
    }
  })

  it('ignores an answer that arrives after a reset', () => {
    const state = decomposeReducer(IDLE_STATE, { type: 'answered', response: PROPOSAL_RESPONSE })

    expect(state).toBe(IDLE_STATE)
  })

  it('does not start a second run while one is running', () => {
    const running = runningState()

    expect(
      decomposeReducer(running, { type: 'started', request: START_REQUEST, startedAt: 2 }),
    ).toBe(running)
  })

  it('edits only the item with the given key', () => {
    const state = decomposeReducer(proposalState(), {
      type: 'item-changed',
      key: 1,
      changes: { title: 'Edited', isIncluded: false, priority: 'high', status: 'in-progress' },
    })

    if (state.phase !== 'proposal') throw new Error('Expected a proposal')
    expect(state.items[1]).toMatchObject({
      title: 'Edited',
      isIncluded: false,
      priority: 'high',
      status: 'in-progress',
    })
    expect(state.items[0]?.title).toBe('Map the signup steps')
  })

  it('ignores edits while the batch is being created', () => {
    const creating = creatingState()

    expect(
      decomposeReducer(creating, { type: 'item-changed', key: 0, changes: { title: 'Late' } }),
    ).toBe(creating)
  })

  it('returns to the proposal with its edits when the batch fails', () => {
    const edited = decomposeReducer(proposalState(), {
      type: 'item-changed',
      key: 0,
      changes: { title: 'Edited' },
    })
    const creating = decomposeReducer(edited, { type: 'create-started' })
    const errors = { items: { 0: 'Title is taken' }, message: null }

    const state = decomposeReducer(creating, { type: 'create-failed', errors })

    if (state.phase !== 'proposal') throw new Error('Expected a proposal')
    expect(state.errors).toEqual(errors)
    expect(state.items[0]?.title).toBe('Edited')
  })

  it('clears old errors when a new batch starts', () => {
    const failed = decomposeReducer(proposalState(), {
      type: 'create-failed',
      errors: { items: {}, message: 'Server down' },
    })

    const state = decomposeReducer(failed, { type: 'create-started' })

    expect(state).toMatchObject({ phase: 'creating', errors: null })
  })

  it('finishes with the created count only from creating', () => {
    expect(decomposeReducer(creatingState(), { type: 'created', createdCount: 2 })).toEqual({
      phase: 'done',
      createdCount: 2,
    })
    expect(decomposeReducer(proposalState(), { type: 'created', createdCount: 2 }).phase).toBe(
      'proposal',
    )
  })

  it('resets from any phase to idle', () => {
    expect(decomposeReducer(creatingState(), { type: 'reset' })).toBe(IDLE_STATE)
  })
})

describe('toDraftItems', () => {
  it('keys items by position and keeps the description', () => {
    const items = PROPOSAL_RESPONSE.kind === 'proposal' ? PROPOSAL_RESPONSE.items : []

    expect(toDraftItems(items)[1]).toEqual({
      key: 1,
      isIncluded: true,
      title: 'Rewrite the welcome email',
      description: 'Shorter, one link.',
      priority: 'low',
      status: 'todo',
    })
  })
})
