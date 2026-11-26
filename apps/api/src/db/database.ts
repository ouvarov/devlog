import type { PgliteDatabase } from 'drizzle-orm/pglite'

import type * as schema from './schema/index.js'

type Database = PgliteDatabase<typeof schema>
type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]
type DatabaseExecutor = Database | DatabaseTransaction

export type { Database, DatabaseExecutor, DatabaseTransaction }
