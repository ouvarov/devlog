import type { Database } from './database.js'
import { type NewTaskRow, tasks } from './schema/index.js'
import { SEED_TASKS, type SeedSubtask } from './seed-tasks.js'

const DAY_MS = 24 * 60 * 60 * 1000

const daysBefore = (now: Date, days: number): Date => new Date(now.getTime() - days * DAY_MS)

const toTaskRow = (seed: SeedSubtask, now: Date, parentId: number | null = null): NewTaskRow => {
  const createdAt = daysBefore(now, seed.createdDaysAgo)
  const completedAt =
    seed.completedDaysAgo === undefined ? null : daysBefore(now, seed.completedDaysAgo)

  return {
    title: seed.title,
    description: seed.description ?? '',
    status: seed.status,
    priority: seed.priority,
    parentId,
    createdAt,
    updatedAt: completedAt ?? createdAt,
    completedAt,
  }
}

const subtasksOf = (parentTitle: string): SeedSubtask[] =>
  SEED_TASKS.find((seed) => seed.title === parentTitle)?.subtasks ?? []

const seedIfEmpty = async (db: Database, now = new Date()): Promise<number> => {
  const [existingTask] = await db.select({ id: tasks.id }).from(tasks).limit(1)
  if (existingTask) return 0

  return db.transaction(async (tx) => {
    const insertedParents = await tx
      .insert(tasks)
      .values(SEED_TASKS.map((seed) => toTaskRow(seed, now)))
      .returning({ id: tasks.id, title: tasks.title })

    const subtaskRows = insertedParents.flatMap(({ id, title }) =>
      subtasksOf(title).map((subtask) => toTaskRow(subtask, now, id)),
    )
    if (subtaskRows.length > 0) await tx.insert(tasks).values(subtaskRows)

    return insertedParents.length + subtaskRows.length
  })
}

export { seedIfEmpty }
