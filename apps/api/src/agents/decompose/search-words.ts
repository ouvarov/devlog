const SEARCH_WORD_MIN_LENGTH = 3
const SEARCH_MAX_WORDS = 8

const searchWordsOf = (query: string): string[] => {
  const words = query.split(/\s+/).filter((word) => word.length >= SEARCH_WORD_MIN_LENGTH)
  return [...new Set(words)].slice(0, SEARCH_MAX_WORDS)
}

export { SEARCH_MAX_WORDS, SEARCH_WORD_MIN_LENGTH, searchWordsOf }
