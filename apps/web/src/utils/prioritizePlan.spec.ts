import { describe, expect, it } from 'vitest'

import { AGENT_FALLBACK_REASONS, type AgentMeta, type TaskView } from '@devlog/shared'

import { LLM_META } from '@/fixtures/prioritizeResponse'

import { getMaxSteps, getPlanBanner, resolveFocus, resolveLater, toKnownTasks } from './prioritizePlan'

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

describe('resolveFocus and resolveLater', () => {
  const known = toKnownTasks([task(1, 'Set up CI'), task(2, 'Fix flaky test')])

  it('attaches the known task to each focus item and keeps the order', () => {
    const focus = resolveFocus(
      [
        { taskId: 2, reason: 'Blocks merges' },
        { taskId: 1, reason: 'In progress' },
      ],
      known,
    )

    expect(focus.map(({ task }) => task?.title)).toEqual(['Fix flaky test', 'Set up CI'])
    expect(focus[0]?.reason).toBe('Blocks merges')
  })

  it('leaves the task empty for an id that no longer exists', () => {
    expect(resolveFocus([{ taskId: 9, reason: 'Gone' }], known)).toEqual([
      { taskId: 9, reason: 'Gone', task: null },
    ])
    expect(resolveLater([1, 9], known).map(({ task }) => task?.title ?? null)).toEqual([
      'Set up CI',
      null,
    ])
  })
})

describe('getMaxSteps', () => {
  it('reads the step limit of the named agent', () => {
    const info = {
      isConfigured: true,
      provider: 'mock',
      modelId: 'mock',
      agents: [{ name: 'prioritize', maxSteps: 6, tools: [] }],
    } as const

    expect(getMaxSteps({ ...info, agents: [...info.agents] }, 'prioritize')).toBe(6)
    expect(getMaxSteps(undefined, 'prioritize')).toBeNull()
  })
})
