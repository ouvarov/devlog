import { describe, expect, it } from 'vitest'

import type { AgentsInfo } from '@devlog/shared'

import { getMaxSteps } from './agents'

describe('getMaxSteps', () => {
  it('reads the step limit of the named agent', () => {
    const info: AgentsInfo = {
      isConfigured: true,
      provider: 'mock',
      modelId: 'mock',
      agents: [
        { name: 'prioritize', maxSteps: 6, tools: [] },
        { name: 'decompose', maxSteps: 8, tools: [] },
      ],
    }

    expect(getMaxSteps(info, 'prioritize')).toBe(6)
    expect(getMaxSteps(info, 'decompose')).toBe(8)
    expect(getMaxSteps(undefined, 'prioritize')).toBeNull()
  })
})
