import Link from 'next/link'
import type { FC } from 'react'

import { Badge } from '@/components/Badge/Badge'
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
          {focus.map(({ taskId, reason, task }) => (
            <li key={taskId} className={styles.focusItem}>
              {task ? (
                <p className={styles.focusTitle}>
                  <Link href={`/tasks/${task.id}`} className={styles.link}>
                    {task.title}
                  </Link>
                  <Badge tone={STATUS_TONES[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                  <Badge tone={PRIORITY_TONES[task.priority]}>
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>
                </p>
              ) : (
                <p className={styles.focusTitle}>
                  <span className={styles.missing}>#{taskId}</span>
                </p>
              )}
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
          {later.map(({ taskId, task }) => (
            <li key={taskId}>
              {task ? (
                <Link href={`/tasks/${task.id}`} className={styles.link}>
                  {task.title}
                </Link>
              ) : (
                <span className={styles.missing}>#{taskId}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    )}
    <p className={styles.summary}>{summary}</p>
  </div>
)

export { PrioritizePlanView }
