'use client'

import type { FC } from 'react'

import { AgentRunMeta } from '@/components/AgentRunMeta/AgentRunMeta'
import { AgentTrace } from '@/components/AgentTrace/AgentTrace'
import { PrioritizePlanView } from '@/components/PrioritizePlanView/PrioritizePlanView'
import { usePlanTasks } from '@/hooks/usePlanTasks'
import type { PrioritizeRun } from '@/types/prioritizePlan'
import { formatDateTime } from '@/utils/date'
import { getPlanBanner, resolveFocus, resolveLater } from '@/utils/prioritizePlan'

import styles from './PrioritizeRunView.module.scss'

type PrioritizeRunViewProps = {
  run: PrioritizeRun
  maxSteps: number | null
}

const PrioritizeRunView: FC<PrioritizeRunViewProps> = ({ run, maxSteps }) => {
  const { plan, meta, trace } = run.response
  const knownTasks = usePlanTasks([...plan.focus.map(({ taskId }) => taskId), ...plan.later])

  return (
    <div className={styles.run}>
      <p className={styles.snapshot}>
        Snapshot from <time dateTime={run.finishedAt}>{formatDateTime(run.finishedAt)}</time>
      </p>
      <PrioritizePlanView
        banner={getPlanBanner(meta)}
        focus={resolveFocus(plan.focus, knownTasks)}
        later={resolveLater(plan.later, knownTasks)}
        summary={plan.summary}
      />
      <AgentRunMeta meta={meta} maxSteps={maxSteps} />
      <AgentTrace steps={trace} />
    </div>
  )
}

export { PrioritizeRunView }
