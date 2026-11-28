import type { FC } from 'react'

import type { AgentMeta } from '@devlog/shared'

import { SOURCE_LABELS, STOP_REASON_LABELS } from '@/config/agentDisplay'
import { formatDuration } from '@/utils/agentTrace'

import styles from './AgentRunMeta.module.scss'

type AgentRunMetaProps = {
  meta: AgentMeta
  maxSteps: number | null
}

const formatSteps = (steps: number, maxSteps: number | null): string =>
  maxSteps === null ? String(steps) : `${steps} (limit ${maxSteps})`

const AgentRunMeta: FC<AgentRunMetaProps> = ({ meta, maxSteps }) => {
  const rows = [
    { label: 'Provider', value: meta.provider },
    { label: 'Model', value: meta.modelId },
    { label: 'Source', value: SOURCE_LABELS[meta.source] },
    { label: 'Stopped by', value: STOP_REASON_LABELS[meta.stoppedBy] },
    { label: 'Steps', value: formatSteps(meta.steps, maxSteps) },
    {
      label: 'Tokens',
      value: `${meta.usage.inputTokens} in / ${meta.usage.outputTokens} out`,
    },
    { label: 'Duration', value: formatDuration(meta.durationMs) },
  ]

  return (
    <dl className={styles.meta}>
      {rows.map(({ label, value }) => (
        <div key={label} className={styles.row}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export { AgentRunMeta }
