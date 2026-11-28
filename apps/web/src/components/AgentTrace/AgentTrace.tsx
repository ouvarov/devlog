'use client'

import { type FC, useId, useState } from 'react'

import type { AgentTraceStep } from '@devlog/shared'

import { AgentTraceSteps } from '@/components/AgentTraceSteps/AgentTraceSteps'
import { Button } from '@/components/Button/Button'
import { pluralize } from '@/utils/text'

import styles from './AgentTrace.module.scss'

type AgentTraceProps = {
  steps: readonly AgentTraceStep[]
}

const AgentTrace: FC<AgentTraceProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const stepsId = useId()

  if (steps.length === 0) return null

  return (
    <section className={styles.trace}>
      <Button
        variant="ghost"
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? stepsId : undefined}
        onClick={() => setIsExpanded((wasExpanded) => !wasExpanded)}
      >
        {isExpanded ? 'Hide' : 'Show'} trace ({pluralize(steps.length, 'step')})
      </Button>
      {isExpanded && <AgentTraceSteps id={stepsId} steps={steps} />}
    </section>
  )
}

export { AgentTrace }
