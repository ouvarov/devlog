import { mkdir } from 'node:fs/promises'

import { PGlite } from '@electric-sql/pglite'
import {
  Global,
  Inject,
  Logger,
  Module,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'

import type { Database } from './database.js'
import { MIGRATIONS_DIR, PGLITE_DATA_DIR } from './db.paths.js'
import { DRIZZLE, PGLITE } from './db.tokens.js'
import * as schema from './schema/index.js'
import { seedIfEmpty } from './seed.js'

const logger = new Logger('DbModule')

const createDatabase = async (pglite: PGlite): Promise<Database> => {
  const db = drizzle({ client: pglite, schema })
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR })

  const seededTaskCount = await seedIfEmpty(db)
  if (seededTaskCount > 0) logger.log(`Seeded ${seededTaskCount} tasks`)

  return db
}

const openPglite = async (): Promise<PGlite> => {
  await mkdir(PGLITE_DATA_DIR, { recursive: true })
  return PGlite.create(PGLITE_DATA_DIR)
}

const pgliteProvider: Provider = {
  provide: PGLITE,
  useFactory: openPglite,
}

const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [PGLITE],
  useFactory: createDatabase,
}

@Global()
@Module({
  providers: [pgliteProvider, drizzleProvider],
  exports: [DRIZZLE],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(PGLITE) private readonly pglite: PGlite) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pglite.close()
  }
}
