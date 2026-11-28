import { describe, expect, it } from 'vitest'

import { getElapsedSeconds } from './elapsed'

const STARTED_AT = 1_000_000

describe('getElapsedSeconds', () => {
  it('counts whole seconds since the start', () => {
    expect(getElapsedSeconds(STARTED_AT, STARTED_AT + 2999)).toBe(2)
    expect(getElapsedSeconds(STARTED_AT, STARTED_AT + 3000)).toBe(3)
  })

  it('is zero when nothing runs', () => {
    expect(getElapsedSeconds(null, STARTED_AT)).toBe(0)
  })

  it('never goes below zero when the clock reading is older than the start', () => {
    expect(getElapsedSeconds(STARTED_AT, STARTED_AT - 5000)).toBe(0)
  })
})
