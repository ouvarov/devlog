import { describe, expect, it } from 'vitest'

import { escapeLikePattern, toContainsPattern } from './like-pattern.js'

describe('escapeLikePattern', () => {
  it('escapes percent, underscore and backslash', () => {
    expect(escapeLikePattern('100%_done\\now')).toBe('100\\%\\_done\\\\now')
  })

  it('leaves other text as it is', () => {
    expect(escapeLikePattern("Fix the user's login [CI]")).toBe("Fix the user's login [CI]")
  })
})

describe('toContainsPattern', () => {
  it('wraps the escaped text in wildcards', () => {
    expect(toContainsPattern('a_b')).toBe('%a\\_b%')
  })
})
