'use client'

import { type FC, useId } from 'react'

import { PLAN_FOCUS_MAX_SIZE, PLAN_FOCUS_MIN_SIZE } from '@devlog/shared'

import { AgentRunning } from '@/components/AgentRunning/AgentRunning'
import { Button } from '@/components/Button/Button'
import { LoadError } from '@/components/LoadError/LoadError'
import { PrioritizeRunView } from '@/components/PrioritizeRunView/PrioritizeRunView'
import { useAgentsInfo } from '@/hooks/useAgentsInfo'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { usePrioritize } from '@/hooks/usePrioritize'
import { getMaxSteps } from '@/utils/prioritizePlan'

import styles from './PrioritizePanel.module.scss'

const PrioritizePanel: FC = () => {
  const { data: agentsInfo } = useAgentsInfo()
  const prioritize = usePrioritize()
  const elapsedSeconds = useElapsedSeconds(prioritize.isPending ? prioritize.submittedAt : null)
  const hintId = useId()

  const maxSteps = getMaxSteps(agentsInfo, 'prioritize')
  const isNotConfigured = agentsInfo?.isConfigured === false
  const isRunDisabled = prioritize.isPending || isNotConfigured

  const handleRun = () => prioritize.mutate()

  return (
    <section className={styles.panel} aria-labelledby="prioritize-heading">
      <div className={styles.header}>
        <h3 id="prioritize-heading" className={styles.title}>
          Prioritize
        </h3>
        <Button
          variant="primary"
          disabled={isRunDisabled}
          aria-describedby={isNotConfigured ? hintId : undefined}
          onClick={handleRun}
        >
          {prioritize.data ? 'Run again' : 'Run'}
        </Button>
      </div>
      <p className={styles.note}>
        Picks {PLAN_FOCUS_MIN_SIZE}–{PLAN_FOCUS_MAX_SIZE} tasks to focus on now, with a reason for
        each.
      </p>
      {isNotConfigured && (
        <p id={hintId} className={styles.hint}>
          Set an LLM key or LLM_PROVIDER=mock to run agents.
        </p>
      )}
      <AgentRunning
        isRunning={prioritize.isPending}
        elapsedSeconds={elapsedSeconds}
        maxSteps={maxSteps}
      />
      {prioritize.error && (
        <LoadError error={prioritize.error} onRetry={isNotConfigured ? undefined : handleRun} />
      )}
      {prioritize.data && <PrioritizeRunView run={prioritize.data} maxSteps={maxSteps} />}
    </section>
  )
}

export { PrioritizePanel }
