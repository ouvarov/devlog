import type { TaskView } from '@devlog/shared'

import type { TaskRecord } from './tasks.repository.js'

const toTaskView = (task: TaskRecord): TaskView => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  parentId: task.parentId,
  subtaskCount: task.subtaskCount,
  subtaskDoneCount: task.subtaskDoneCount,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
  completedAt: task.completedAt?.toISOString() ?? null,
})

export { toTaskView }
