import Link from 'next/link'
import type { FC } from 'react'

import type { PlanTaskRef, UnresolvedPlanTaskKind } from '@/types/prioritizePlan'

import styles from './PlanTaskName.module.scss'

type PlanTaskNameProps = {
  taskId: number
  taskRef: PlanTaskRef
}

const UNRESOLVED_LABELS = {
  loading: () => 'Loading task…',
  missing: (taskId) => `#${taskId}`,
  failed: (taskId) => `#${taskId} (could not load)`,
} satisfies Record<UnresolvedPlanTaskKind, (taskId: number) => string>

const PlanTaskName: FC<PlanTaskNameProps> = ({ taskId, taskRef }) => {
  if (taskRef.kind === 'found') {
    return (
      <Link href={`/tasks/${taskRef.task.id}`} className={styles.link}>
        {taskRef.task.title}
      </Link>
    )
  }

  return <span className={styles[taskRef.kind]}>{UNRESOLVED_LABELS[taskRef.kind](taskId)}</span>
}

export { PlanTaskName }
