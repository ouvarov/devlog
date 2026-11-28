import type { FC } from 'react'

import type { AgentTraceStep } from '@devlog/shared'

import { Badge } from '@/components/Badge/Badge'
import { formatToolInput } from '@/utils/agentTrace'

import styles from './AgentTraceSteps.module.scss'

type AgentTraceStepsProps = {
  id?: string
  steps: readonly AgentTraceStep[]
}

const AgentTraceSteps: FC<AgentTraceStepsProps> = ({ id, steps }) => (
  <ol id={id} className={styles.steps}>
    {steps.map(({ index, text, toolCalls, finishReason }) => (
      <li key={index} className={styles.step}>
        <p className={styles.stepHeader}>
          <span className={styles.stepTitle}>Step {index + 1}</span>
          <span className={styles.finish}>{finishReason}</span>
        </p>
        {text && <p className={styles.text}>{text}</p>}
        <ul className={styles.calls}>
          {toolCalls.map((call, callIndex) => (
            <li
              key={`${index}-${callIndex}`}
              className={call.isError || call.isRejectedSubmit ? styles.callFlagged : styles.call}
            >
              <p className={styles.callHeader}>
                <code className={styles.toolName}>{call.toolName}</code>
                {call.isRejectedSubmit && <Badge tone="danger">Rejected submit</Badge>}
                {call.isError && <Badge tone="danger">Tool error</Badge>}
              </p>
              <p className={styles.label}>Input</p>
              <pre className={styles.code}>{formatToolInput(call.input)}</pre>
              <p className={styles.label}>Output</p>
              <pre className={styles.code}>{call.output}</pre>
            </li>
          ))}
        </ul>
      </li>
    ))}
  </ol>
)

export { AgentTraceSteps }
