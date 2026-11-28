import type { FC } from 'react'

import styles from './AgentRunning.module.scss'

type AgentRunningProps = {
  elapsedSeconds: number
  maxSteps: number | null
}

const AgentRunning: FC<AgentRunningProps> = ({ elapsedSeconds, maxSteps }) => (
  <div className={styles.running}>
    <span className={styles.spinner} aria-hidden="true" />
    <p className={styles.text} role="status">
      Running the agent{maxSteps === null ? '' : `, up to ${maxSteps} steps`}…
    </p>
    <span className={styles.elapsed}>{elapsedSeconds} s</span>
  </div>
)

export { AgentRunning }
