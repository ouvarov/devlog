import type { FC } from 'react'

import styles from './AgentRunning.module.scss'

type AgentRunningProps = {
  isRunning: boolean
  elapsedSeconds: number
  maxSteps: number | null
}

const getRunningText = (maxSteps: number | null): string =>
  maxSteps === null ? 'Running the agent…' : `Running the agent, up to ${maxSteps} steps…`

const AgentRunning: FC<AgentRunningProps> = ({ isRunning, elapsedSeconds, maxSteps }) => (
  <div className={isRunning ? styles.running : styles.idle}>
    {isRunning && <span className={styles.spinner} aria-hidden="true" />}
    <p className={styles.text} role="status">
      {isRunning ? getRunningText(maxSteps) : ''}
    </p>
    {isRunning && <span className={styles.elapsed}>{elapsedSeconds} s</span>}
  </div>
)

export { AgentRunning }
