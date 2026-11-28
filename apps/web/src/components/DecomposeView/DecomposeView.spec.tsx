import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CLARIFY_RESPONSE, PROPOSAL_RESPONSE, SEARCH_STEP } from '@/fixtures/decomposeResponse'
import type { DecomposeState } from '@/types/decompose'
import { IDLE_STATE, decomposeReducer } from '@/utils/decomposeState'

import { DecomposeView } from './DecomposeView'

const MAX_STEPS = 6

const renderState = (state: DecomposeState, isNotConfigured = false) =>
  renderToStaticMarkup(
    <DecomposeView
      state={state}
      maxSteps={MAX_STEPS}
      elapsedSeconds={3}
      isNotConfigured={isNotConfigured}
      onStart={() => {}}
      onAnswer={() => {}}
      onSkipQuestions={() => {}}
      onItemChange={() => {}}
      onCreate={() => {}}
      onRetry={() => {}}
      onClose={() => {}}
    />,
  )

const running = decomposeReducer(IDLE_STATE, {
  type: 'started',
  request: { taskId: 4 },
  startedAt: 1,
})
const clarify = decomposeReducer(running, { type: 'answered', response: CLARIFY_RESPONSE })
const proposal = decomposeReducer(running, { type: 'answered', response: PROPOSAL_RESPONSE })

describe('DecomposeView', () => {
  it('offers the no-questions option before the run, with an empty live region', () => {
    const markup = renderState(IDLE_STATE)

    expect(markup).toContain('Don&#x27;t ask questions')
    expect(markup).toMatch(/<p[^>]*role="status"[^>]*><\/p>/)
    expect(markup).toContain('Break down')
  })

  it('disables the start with a hint when no LLM is configured', () => {
    const markup = renderState(IDLE_STATE, true)

    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Break down<\/button>/)
    expect(markup).toContain('LLM_PROVIDER=mock')
  })

  it('wraps each phase in a focusable group named after the phase', () => {
    expect(renderState(clarify)).toMatch(
      /<div[^>]*tabindex="-1"[^>]*role="group"[^>]*aria-label="Questions from the agent"/,
    )
  })

  it('announces the run in the live region while running', () => {
    expect(renderState(running)).toMatch(
      /role="status"[^>]*>Running the agent, up to 6 steps…<\/p>/,
    )
  })

  it('shows one required answer field per question, with the run details', () => {
    const markup = renderState(clarify)

    expect(markup.match(/<textarea[^>]*required=""/g)).toHaveLength(2)
    expect(markup).toContain('Which screens are confusing?')
    expect(markup).toContain('Skip questions')
    expect(markup).toContain('Show trace (1 step)')
    expect(markup).toContain('mock-decompose')
  })

  it('marks an empty answer and announces a summary after Continue', () => {
    const invalid = decomposeReducer(clarify, {
      type: 'answers-invalid',
      errors: {
        answers: { 1: 'This field is required' },
        message: 'Answer the marked questions to continue.',
      },
    })
    const markup = renderState(invalid)

    expect(markup.match(/aria-invalid="true"/g)).toHaveLength(1)
    expect(markup).toContain('This field is required')
    expect(markup).toMatch(/role="alert"[^>]*>Answer the marked questions to continue\./)
  })

  it('renders model questions as text', () => {
    const markup = renderState(clarify)

    expect(markup).toContain('&lt;b&gt;Who&lt;/b&gt; is the user?')
    expect(markup).not.toContain('<b>')
  })

  it('lists every proposed item ticked, with pickers, assumptions and a counted create', () => {
    const markup = renderState(proposal)

    expect(markup.match(/<input[^>]*type="checkbox"[^>]*checked=""/g)).toHaveLength(3)
    expect(markup.match(/<select/g)).toHaveLength(6)
    expect(markup).toContain('value="Map the signup steps"')
    expect(markup).toContain('Shorter, one link.')
    expect(markup).toContain('The web app only, not mobile.')
    expect(markup).toContain('Create 3 subtasks')
  })

  it('renders a model title with HTML as an input value, not markup', () => {
    const markup = renderState(proposal)

    expect(markup).toContain('value="&lt;img src=x onerror=alert(1)&gt;"')
    expect(markup).not.toContain('<img')
  })

  it('counts only ticked items and disables create when none is ticked', () => {
    const oneUnticked = decomposeReducer(proposal, {
      type: 'item-changed',
      key: 0,
      changes: { isIncluded: false },
    })
    const noneTicked = [1, 2].reduce(
      (state, key) =>
        decomposeReducer(state, { type: 'item-changed', key, changes: { isIncluded: false } }),
      oneUnticked,
    )

    expect(renderState(oneUnticked)).toContain('Create 2 subtasks')
    expect(renderState(noneTicked)).toMatch(/<button[^>]*disabled=""[^>]*>Create 0 subtasks/)
  })

  it('shows item and form errors after a failed batch', () => {
    const failed = decomposeReducer(proposal, {
      type: 'create-failed',
      errors: { items: { 1: 'Title is taken' }, message: 'Fix the marked subtasks and try again.' },
    })
    const markup = renderState(failed)

    expect(markup).toContain('Title is taken')
    expect(markup).toMatch(/role="alert"[^>]*>Fix the marked subtasks and try again\./)
  })

  it('locks the proposal while creating', () => {
    const markup = renderState(decomposeReducer(proposal, { type: 'create-started' }))

    expect(markup).toMatch(/<fieldset[^>]*disabled=""/)
    expect(markup).toContain('Creating…')
  })

  it('reports how many subtasks were created', () => {
    const markup = renderState({ phase: 'done', createdCount: 2 })

    expect(markup).toContain('2 subtasks created.')
    expect(markup).toMatch(/<button[^>]*data-phase-focus="true"[^>]*>Close/)
  })

  it('shows a failed run with its trace and Try again', () => {
    const markup = renderState({
      phase: 'error',
      request: { taskId: 4 },
      error: {
        title: 'The agent did not finish',
        message: 'Step limit reached',
        trace: [SEARCH_STEP],
        canRetry: true,
      },
    })

    expect(markup).toMatch(/role="alert"/)
    expect(markup).toContain('Step limit reached')
    expect(markup).toContain('Show trace (1 step)')
    expect(markup).toContain('Try again')
    expect(markup).toContain('Nothing was created.')
    expect(markup).toMatch(/<button[^>]*data-phase-focus="true"[^>]*>Try again/)
    expect(markup.match(/data-phase-focus/g)).toHaveLength(1)
  })

  it('offers no Try again when retrying cannot help', () => {
    const markup = renderState({
      phase: 'error',
      request: { taskId: 4 },
      error: { title: 'No LLM is configured', message: 'No LLM', trace: null, canRetry: false },
    })

    expect(markup).toContain('No LLM')
    expect(markup).not.toContain('Try again')
    expect(markup).not.toContain('recorded any step')
    expect(markup).toMatch(/<button[^>]*data-phase-focus="true"[^>]*>Close/)
  })

  it('says so when the agent failed before its first step', () => {
    const markup = renderState({
      phase: 'error',
      request: { taskId: 4 },
      error: { title: 'Failed', message: 'The model call failed', trace: [], canRetry: true },
    })

    expect(markup).toContain('The agent failed before it recorded any step.')
  })
})
