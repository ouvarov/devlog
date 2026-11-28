import { describe, expect, it } from 'vitest'

import { AGENT_FALLBACK_REASONS, type AgentMeta, type TaskView } from '@devlog/shared'

import { ApiRequestError } from '@/api/client'
import { LLM_META } from '@/fixtures/prioritizeResponse'
import type { TaskLookup } from '@/types/prioritizePlan'

import {
  getPlanBanner,
  getPlanTaskRefs,
  getUnlistedIds,
  resolveFocus,
  resolveLater,
} from './prioritizePlan'

const fallbackMeta = (changes: Partial<AgentMeta>): AgentMeta => ({
  ...LLM_META,
  source: 'fallback',
  stoppedBy: 'error',
  ...changes,
})

const task = (id: number, title: string): TaskView => ({
  id,
  title,
  description: '',
  status: 'todo',
  priority: 'medium',
  parentId: null,
  subtaskCount: 0,
  subtaskDoneCount: 0,
  createdAt: '2026-11-20T10:00:00.000Z',
  updatedAt: '2026-11-20T10:00:00.000Z',
  completedAt: null,
})

describe('getPlanBanner', () => {
  it('shows nothing for a plan from the model', () => {
    expect(getPlanBanner(LLM_META)).toBeNull()
  })

  it('says nothing to prioritize for a skipped run, not computed without AI', () => {
    const banner = getPlanBanner(fallbackMeta({ stoppedBy: 'skipped', steps: 0 }))

    expect(banner).toMatchObject({ kind: 'skipped', title: 'Nothing to prioritize' })
  })

  it.each([
    ['rate-limited', 'rate limit'],
    ['timeout', 'did not answer in time'],
    ['invalid-output', 'did not submit a valid plan'],
    ['llm-error', 'returned an error'],
  ] as const)('explains the %s fallback in words', (fallbackReason, words) => {
    const banner = getPlanBanner(fallbackMeta({ fallbackReason }))

    expect(banner).toMatchObject({ kind: 'fallback', title: 'Computed without AI' })
    expect(banner?.message).toContain(words)
  })

  it('has a message for every fallback reason', () => {
    for (const fallbackReason of AGENT_FALLBACK_REASONS) {
      expect(getPlanBanner(fallbackMeta({ fallbackReason }))?.message).not.toBe('')
    }
  })
})

const lookup = (changes: Partial<TaskLookup>): TaskLookup => ({
  data: undefined,
  isPending: false,
  error: null,
  ...changes,
})

const failedWith = (status: number) =>
  lookup({ error: new ApiRequestError({ message: 'Request failed', status }) })

describe('getUnlistedIds', () => {
  it('asks only for ids the top-level list does not have', () => {
    expect(getUnlistedIds([1, 14, 2], [task(1, 'A'), task(2, 'B')], false)).toEqual([14])
  })

  it('asks for nothing while the list is still loading', () => {
    expect(getUnlistedIds([1, 14], undefined, false)).toEqual([])
  })

  it('asks for every id when the list failed', () => {
    expect(getUnlistedIds([1, 14], undefined, true)).toEqual([1, 14])
  })
})

describe('getPlanTaskRefs', () => {
  const listed = [task(1, 'Set up CI'), task(2, 'Fix flaky test')]

  it('finds listed tasks without a lookup', () => {
    const refs = getPlanTaskRefs([2], listed, new Map())

    expect(refs.get(2)).toMatchObject({ kind: 'found', task: { title: 'Fix flaky test' } })
  })

  it('is loading while the list has not arrived', () => {
    expect(getPlanTaskRefs([1], undefined, new Map()).get(1)).toEqual({ kind: 'loading' })
  })

  it('is loading while the detail of an unlisted task is pending', () => {
    const refs = getPlanTaskRefs([14], listed, new Map([[14, lookup({ isPending: true })]]))

    expect(refs.get(14)).toEqual({ kind: 'loading' })
  })

  it('finds an unlisted task once its detail arrives', () => {
    const refs = getPlanTaskRefs([14], listed, new Map([[14, lookup({ data: task(14, 'Sub') })]]))

    expect(refs.get(14)).toMatchObject({ kind: 'found', task: { title: 'Sub' } })
  })

  it('is missing only when the detail answers 404', () => {
    const refs = getPlanTaskRefs(
      [9, 10],
      listed,
      new Map([
        [9, failedWith(404)],
        [10, failedWith(500)],
      ]),
    )

    expect(refs.get(9)).toEqual({ kind: 'missing' })
    expect(refs.get(10)).toEqual({ kind: 'failed' })
  })
})

describe('resolveFocus and resolveLater', () => {
  const refs = getPlanTaskRefs(
    [1, 2, 9],
    [task(1, 'Set up CI'), task(2, 'Fix flaky test')],
    new Map([[9, failedWith(404)]]),
  )

  it('attaches the task ref to each focus item and keeps the order', () => {
    const focus = resolveFocus(
      [
        { taskId: 2, reason: 'Blocks merges' },
        { taskId: 1, reason: 'In progress' },
      ],
      refs,
    )

    expect(focus.map(({ taskRef }) => taskRef.kind)).toEqual(['found', 'found'])
    expect(focus[0]).toMatchObject({ reason: 'Blocks merges', taskRef: { task: { id: 2 } } })
  })

  it('keeps a deleted task as missing and an unknown id as loading', () => {
    expect(resolveLater([1, 9, 7], refs).map(({ taskRef }) => taskRef.kind)).toEqual([
      'found',
      'missing',
      'loading',
    ])
  })
})
