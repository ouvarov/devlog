import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { PGlite } from '@electric-sql/pglite'
import { Test, type TestingModule } from '@nestjs/testing'
import { count, isNotNull } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'

import type { Database } from './database.js'
import { DbModule } from './db.module.js'
import { DRIZZLE, PGLITE } from './db.tokens.js'
import { tasks } from './schema/index.js'
import { seedIfEmpty } from './seed.js'

const SEED_TASK_COUNT = 14
const SEED_SUBTASK_COUNT = 2

const createDbModule = (dataDir = 'memory://'): Promise<TestingModule> =>
  Test.createTestingModule({ imports: [DbModule] })
    .overrideProvider(PGLITE)
    .useFactory({ factory: () => PGlite.create(dataDir) })
    .compile()

const countTasks = async (db: Database): Promise<number> => {
  const [row] = await db.select({ total: count() }).from(tasks)
  return row?.total ?? 0
}

const countSubtasks = async (db: Database): Promise<number> => {
  const [row] = await db.select({ total: count() }).from(tasks).where(isNotNull(tasks.parentId))
  return row?.total ?? 0
}

describe('DbModule', () => {
  let moduleRef: TestingModule | undefined

  afterEach(async () => {
    await moduleRef?.close()
    moduleRef = undefined
  })

  it('migrates an in-memory database and seeds 14 tasks', async () => {
    moduleRef = await createDbModule()
    const db = moduleRef.get<Database>(DRIZZLE)

    expect(await countTasks(db)).toBe(SEED_TASK_COUNT)
    expect(await countSubtasks(db)).toBe(SEED_SUBTASK_COUNT)
  })

  it('does not seed a database that already has tasks', async () => {
    moduleRef = await createDbModule()
    const db = moduleRef.get<Database>(DRIZZLE)

    expect(await seedIfEmpty(db)).toBe(0)
    expect(await countTasks(db)).toBe(SEED_TASK_COUNT)
  })

  it('closes PGlite on shutdown', async () => {
    const closedModuleRef = await createDbModule()
    const pglite = closedModuleRef.get<PGlite>(PGLITE)

    await closedModuleRef.close()

    expect(pglite.closed).toBe(true)
  })

  it('keeps the seed without duplicates after a restart on the same data directory', async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), 'devlog-pglite-'))
    try {
      const firstRun = await createDbModule(dataDir)
      await firstRun.close()

      moduleRef = await createDbModule(dataDir)
      expect(await countTasks(moduleRef.get<Database>(DRIZZLE))).toBe(SEED_TASK_COUNT)

      await moduleRef.close()
      moduleRef = undefined
    } finally {
      await rm(dataDir, { recursive: true, force: true })
    }
  })
})
