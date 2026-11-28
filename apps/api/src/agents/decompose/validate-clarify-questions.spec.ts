import { describe, expect, it } from 'vitest'

import { CLARIFY_QUESTION_MAX_LENGTH } from '@devlog/shared'

import { validateClarifyQuestions } from './validate-clarify-questions.js'

describe('validateClarifyQuestions', () => {
  it('accepts 1 to 3 questions and trims them', () => {
    expect(validateClarifyQuestions({ questions: ['  Which pages are slow? '] })).toEqual({
      accepted: true,
      value: { questions: ['Which pages are slow?'] },
    })
  })

  it.each([
    ['no questions', []],
    ['four questions', ['One?', 'Two?', 'Three?', 'Four?']],
    ['an empty question', ['Which pages?', '   ']],
    ['a question over the limit', ['x'.repeat(CLARIFY_QUESTION_MAX_LENGTH + 1)]],
  ])('rejects %s', (_case, questions) => {
    expect(validateClarifyQuestions({ questions }).accepted).toBe(false)
  })
})
