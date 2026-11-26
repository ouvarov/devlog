import { type SQL, sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

import { TASK_PRIORITIES, TASK_STATUSES } from '@devlog/shared'

const quoteSqlLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`

// DDL cannot take bound parameters, so the compile-time constants are inlined as quoted literals.
const toSqlLiteralList = (values: readonly string[]): SQL =>
  sql.raw(values.map(quoteSqlLiteral).join(', '))

const tasks = pgTable(
  'tasks',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: text('status', { enum: TASK_STATUSES }).notNull().default('todo'),
    priority: text('priority', { enum: TASK_PRIORITIES }).notNull().default('medium'),
    parentId: integer('parent_id').references((): AnyPgColumn => tasks.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('tasks_parent_id_idx').on(table.parentId),
    index('tasks_status_created_at_idx').on(table.status, table.createdAt.desc()),
    check('tasks_status_check', sql`${table.status} in (${toSqlLiteralList(TASK_STATUSES)})`),
    check('tasks_priority_check', sql`${table.priority} in (${toSqlLiteralList(TASK_PRIORITIES)})`),
  ],
)

type TaskRow = typeof tasks.$inferSelect
type NewTaskRow = typeof tasks.$inferInsert

export { tasks }
export type { NewTaskRow, TaskRow }
