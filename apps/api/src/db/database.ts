import type { PgliteDatabase } from 'drizzle-orm/pglite'

import type * as schema from './schema/index.js'

type Database = PgliteDatabase<typeof schema>

export type { Database }
