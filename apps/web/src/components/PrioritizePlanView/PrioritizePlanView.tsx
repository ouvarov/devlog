import type { FC } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { PlanTaskName } from '@/components/PlanTaskName/PlanTaskName'
import { PRIORITY_LABELS, PRIORITY_TONES, STATUS_LABELS, STATUS_TONES } from '@/config/taskDisplay'
import type { PlanBanner, ResolvedFocusItem, ResolvedLaterItem } from '@/types/prioritizePlan'

import styles from './PrioritizePlanView.module.scss'

type PrioritizePlanViewProps = {
  banner: PlanBanner | null
  focus: readonly ResolvedFocusItem[]
  later: readonly ResolvedLaterItem[]
  summary: string
}

const PrioritizePlanView: FC<PrioritizePlanViewProps> = ({ banner, focus, later, summary }) => (
  <div className={styles.plan}>
    {banner && (
      <div className={styles[banner.kind]} role="status">
        <p className={styles.bannerTitle}>{banner.title}</p>
        <p className={styles.bannerText}>{banner.message}</p>
      </div>
    )}
    {focus.length > 0 && (
      <section>
        <h4 className={styles.heading}>Focus now</h4>
        <ol className={styles.focus}>
          {focus.map(({ taskId, reason, taskRef }) => (
            <li key={taskId} className={styles.focusItem}>
              <p className={styles.focusTitle}>
                <PlanTaskName taskId={taskId} taskRef={taskRef} />
                {taskRef.kind === 'found' && (
                  <>
                    <Badge tone={STATUS_TONES[taskRef.task.status]}>
                      {STATUS_LABELS[taskRef.task.status]}
                    </Badge>
                    <Badge tone={PRIORITY_TONES[taskRef.task.priority]}>
                      {PRIORITY_LABELS[taskRef.task.priority]}
                    </Badge>
                  </>
                )}
              </p>
              <p className={styles.reason}>{reason}</p>
            </li>
          ))}
        </ol>
      </section>
    )}
    {later.length > 0 && (
      <section>
        <h4 className={styles.heading}>Later</h4>
        <ul className={styles.later}>
          {later.map(({ taskId, taskRef }) => (
            <li key={taskId}>
              <PlanTaskName taskId={taskId} taskRef={taskRef} />
            </li>
          ))}
        </ul>
      </section>
    )}
    <p className={styles.summary}>{summary}</p>
  </div>
)

export { PrioritizePlanView }
