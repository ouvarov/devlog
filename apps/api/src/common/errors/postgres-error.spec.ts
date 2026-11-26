import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Database } from '../../db/database.js'
import { MIGRATIONS_DIR } from '../../db/db.paths.js'
import * as schema from '../../db/schema/index.js'
import { tasks } from '../../db/schema/index.js'
import { mapPostgresError } from './postgres-error.js'

const MISSING_TASK_ID = 999_999

const rejectionOf = async (query: PromiseLike<unknown>): Promise<unknown> => {
  try {
    await query
  } catch (error) {
    return error
  }
  throw new Error('Expected the query to fail')
}

describe('mapPostgresError', () => {
  let pglite: PGlite
  let db: Database

  beforeAll(async () => {
    pglite = await PGlite.create('memory://')
    db = drizzle({ client: pglite, schema })
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR })
  })

  afterAll(async () => {
    await pglite.close()
  })

  it('maps a foreign key violation to 404 NOT_FOUND', async () => {
    const error = await rejectionOf(
      db.insert(tasks).values({ title: 'Orphan', parentId: MISSING_TASK_ID }),
    )

    expect(mapPostgresError(error)).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
  })

  it('maps a check violation to 400 VALIDATION_FAILED', async () => {
    const error = await rejectionOf(
      db.execute(sql`insert into ${tasks} (title, status) values ('Task', 'blocked')`),
    )

    expect(mapPostgresError(error)).toMatchObject({ statusCode: 400, code: 'VALIDATION_FAILED' })
  })

  it('maps an invalid text representation to 400 VALIDATION_FAILED', async () => {
    const error = await rejectionOf(db.execute(sql`select ${'abc'}::integer`))

    expect(mapPostgresError(error)).toMatchObject({ statusCode: 400, code: 'VALIDATION_FAILED' })
  })

  it('leaves other database errors unmapped', async () => {
    const error = await rejectionOf(db.execute(sql`select * from missing_table`))

    expect(mapPostgresError(error)).toBeNull()
  })

  it('leaves errors without a database code unmapped', () => {
    expect(mapPostgresError(new Error('boom'))).toBeNull()
  })
})
