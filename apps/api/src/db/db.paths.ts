import { fileURLToPath } from 'node:url'

const PGLITE_DATA_DIR = fileURLToPath(new URL('../../.data/pglite', import.meta.url))
const MIGRATIONS_DIR = fileURLToPath(new URL('../../drizzle', import.meta.url))

export { MIGRATIONS_DIR, PGLITE_DATA_DIR }
