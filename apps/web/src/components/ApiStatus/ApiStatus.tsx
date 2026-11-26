'use client'

import type { FC } from 'react'

import { type ApiHealth, useApiHealth } from '@/hooks/useApiHealth'

import styles from './ApiStatus.module.scss'

const HEALTH_LABELS = {
  checking: 'Checking API…',
  online: 'API online',
  offline: 'API offline',
} satisfies Record<ApiHealth, string>

const ApiStatus: FC = () => {
  const health = useApiHealth()

  return (
    <p className={`${styles.status} ${styles[health]}`} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {HEALTH_LABELS[health]}
    </p>
  )
}

export { ApiStatus }
