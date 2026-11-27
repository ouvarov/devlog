import type { FC } from 'react'

import { ApiRequestError } from '@/api/client'
import { Button } from '@/components/Button/Button'
import { API_URL } from '@/config/api'

import styles from './LoadError.module.scss'

type LoadErrorProps = {
  error: Error
  onRetry: () => void
}

const getLoadErrorMessage = (error: Error): string =>
  error instanceof ApiRequestError && error.isNetworkError
    ? `The API at ${API_URL} is offline. Start it with "npm run dev" and retry.`
    : error.message

const LoadError: FC<LoadErrorProps> = ({ error, onRetry }) => (
  <div className={styles.error} role="alert">
    <p className={styles.message}>{getLoadErrorMessage(error)}</p>
    <Button onClick={onRetry}>Retry</Button>
  </div>
)

export { LoadError }
