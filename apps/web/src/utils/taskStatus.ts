import type { TaskStatus } from '@devlog/shared'

const needsDoneConfirmation = (
  nextStatus: TaskStatus | undefined,
  openSubtaskCount: number,
): boolean => nextStatus === 'done' && openSubtaskCount > 0

export { needsDoneConfirmation }
