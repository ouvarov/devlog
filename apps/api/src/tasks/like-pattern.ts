// Postgres LIKE treats a backslash as the default escape character.
const LIKE_SPECIAL_CHARACTERS = /[\\%_]/g

const escapeLikePattern = (text: string): string =>
  text.replace(LIKE_SPECIAL_CHARACTERS, (character) => `\\${character}`)

const toContainsPattern = (text: string): string => `%${escapeLikePattern(text)}%`

export { escapeLikePattern, toContainsPattern }
