import { describe, expect, it } from 'vitest'

import { ApiRequestError } from '@/api/client'
import { SEARCH_STEP } from '@/fixtures/decomposeResponse'
import type { ProposalItemDraft } from '@/types/decompose'

import {
  getBatchErrors,
  getDecomposeErrorView,
  toBatchInput,
  toClarifiedRequest,
  toStartRequest,
} from './decompose'

const PARENT_ID = 4
const QUESTIONS = ['Which screens?', 'Who is the user?']

const draft = (key: number, changes: Partial<ProposalItemDraft> = {}): ProposalItemDraft => ({
  key,
  isIncluded: true,
  title: `Item ${key}`,
  description: undefined,
  priority: 'medium',
  status: 'todo',
  ...changes,
})

const apiError = (status: number, code: ApiRequestError['code'], message = 'Failed') =>
  new ApiRequestError({ message, status, code })

describe('toStartRequest', () => {
  it('sends only the task id when questions are allowed', () => {
    expect(toStartRequest(PARENT_ID, false)).toStrictEqual({ taskId: PARENT_ID })
  })

  it('sends skipClarification when the user wants no questions', () => {
    expect(toStartRequest(PARENT_ID, true)).toStrictEqual({
      taskId: PARENT_ID,
      skipClarification: true,
    })
  })
})

describe('toClarifiedRequest', () => {
  it('sends the questions as received with trimmed answers and no skip key', () => {
    const result = toClarifiedRequest(PARENT_ID, QUESTIONS, ['  Signup  ', 'New users'])

    expect(result).toStrictEqual({
      success: true,
      data: {
        taskId: PARENT_ID,
        clarification: { questions: QUESTIONS, answers: ['Signup', 'New users'] },
      },
    })
  })

  it('marks each empty answer by its position', () => {
    const result = toClarifiedRequest(PARENT_ID, QUESTIONS, ['Signup', '   '])

    expect(result).toEqual({
      success: false,
      errors: {
        answers: { 1: 'This field is required' },
        message: 'Answer the marked questions to continue.',
      },
    })
  })

  it('marks an answer over the length limit', () => {
    const result = toClarifiedRequest(PARENT_ID, QUESTIONS, ['x'.repeat(501), 'ok'])

    expect(result).toEqual({
      success: false,
      errors: {
        answers: { 0: 'Must be at most 500 characters' },
        message: 'Answer the marked questions to continue.',
      },
    })
  })
})

describe('toBatchInput', () => {
  it('creates only the ticked items, as edited, under the parent', () => {
    const items = [
      draft(0, { title: '  Edited title  ', description: 'Details' }),
      draft(1, { isIncluded: false }),
      draft(2, { priority: 'high', status: 'in-progress' }),
    ]

    const result = toBatchInput(PARENT_ID, items)

    expect(result).toStrictEqual({
      success: true,
      data: {
        create: [
          {
            title: 'Edited title',
            description: 'Details',
            priority: 'medium',
            status: 'todo',
            parentId: PARENT_ID,
          },
          {
            title: 'Item 2',
            description: undefined,
            priority: 'high',
            status: 'in-progress',
            parentId: PARENT_ID,
          },
        ],
        update: [],
      },
    })
  })

  it('marks an emptied title on the item it belongs to, skipping unticked items', () => {
    const items = [draft(0, { isIncluded: false, title: '' }), draft(1), draft(2, { title: ' ' })]

    const result = toBatchInput(PARENT_ID, items)

    expect(result).toEqual({
      success: false,
      errors: {
        items: { 2: 'This field is required' },
        message: 'Fix the marked subtasks and try again.',
      },
    })
  })
})

describe('getBatchErrors', () => {
  it('maps a server issue index to the ticked item at that position', () => {
    const items = [draft(0), draft(1, { isIncluded: false }), draft(2)]
    const error = new ApiRequestError({
      message: 'Validation failed',
      status: 400,
      code: 'VALIDATION_FAILED',
      issues: [{ path: ['create', 1, 'title'], message: 'Title is taken' }],
    })

    expect(getBatchErrors(error, items)).toEqual({
      items: { 2: 'Title is taken' },
      message: 'Fix the marked subtasks and try again.',
    })
  })

  it('shows the server message when the error has no issues', () => {
    const error = apiError(400, 'BAD_REQUEST', 'Parent 4 is done')

    expect(getBatchErrors(error, [draft(0)])).toEqual({ items: {}, message: 'Parent 4 is done' })
  })
})

describe('getDecomposeErrorView', () => {
  it('shows the reason and trace of a failed agent and offers a retry', () => {
    const error = new ApiRequestError({
      message: 'Step limit reached without valid subtasks',
      status: 422,
      code: 'AGENT_FAILED',
      trace: [SEARCH_STEP],
    })

    expect(getDecomposeErrorView(error)).toEqual({
      title: 'The agent did not finish',
      message: 'Step limit reached without valid subtasks',
      trace: [SEARCH_STEP],
      canRetry: true,
    })
  })

  it('offers no retry when no LLM is configured', () => {
    const view = getDecomposeErrorView(apiError(503, 'LLM_NOT_CONFIGURED', 'No LLM'))

    expect(view).toMatchObject({ title: 'No LLM is configured', canRetry: false })
  })

  it.each([
    ['a subtask or done task', 400, 'BAD_REQUEST'],
    ['a deleted task', 404, 'NOT_FOUND'],
  ] as const)('offers no retry for %s', (_case, status, code) => {
    expect(getDecomposeErrorView(apiError(status, code)).canRetry).toBe(false)
  })

  it('offers a retry when the API is offline', () => {
    const offline = new ApiRequestError({ message: 'Cannot reach the API', status: null })

    expect(getDecomposeErrorView(offline)).toMatchObject({ canRetry: true, trace: null })
  })
})
