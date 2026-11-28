import type { FC } from 'react'

import { AgentTrace } from '@/components/AgentTrace/AgentTrace'
import { Button } from '@/components/Button/Button'
import type { DecomposeErrorView } from '@/types/decompose'

import styles from './DecomposeError.module.scss'

type DecomposeErrorProps = {
  error: DecomposeErrorView
  onRetry: () => void
  onClose: () => void
}

const DecomposeError: FC<DecomposeErrorProps> = ({ error, onRetry, onClose }) => (
  <div className={styles.failure}>
    <div className={styles.alert} role="alert">
      <p className={styles.title}>{error.title}</p>
      <p className={styles.message}>{error.message}</p>
      <p className={styles.note}>Nothing was created.</p>
    </div>
    <AgentTrace steps={error.trace} />
    <div className={styles.actions}>
      <Button onClick={onClose}>Close</Button>
      {error.canRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  </div>
)

export { DecomposeError }
