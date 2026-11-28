import { describe, expect, it } from 'vitest'

import { SEARCH_MAX_WORDS, searchWordsOf } from './search-words.js'

describe('searchWordsOf', () => {
  it('ignores words shorter than 3 characters', () => {
    expect(searchWordsOf('fix a UI bug in login')).toEqual(['fix', 'bug', 'login'])
  })

  it('returns nothing for a query of short words only', () => {
    expect(searchWordsOf(' a  to %_ ')).toEqual([])
  })

  it('keeps each word once and caps the number of words', () => {
    const query = Array.from({ length: SEARCH_MAX_WORDS + 3 }, (_, index) => `word${index}`)

    expect(searchWordsOf('cache cache api')).toEqual(['cache', 'api'])
    expect(searchWordsOf(query.join(' '))).toHaveLength(SEARCH_MAX_WORDS)
  })

  it('keeps LIKE wildcards inside a word for the repository to escape', () => {
    expect(searchWordsOf('100% snake_case')).toEqual(['100%', 'snake_case'])
  })
})
