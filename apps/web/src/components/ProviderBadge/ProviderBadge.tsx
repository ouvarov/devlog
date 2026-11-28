'use client'

import type { FC } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { LoadError } from '@/components/LoadError/LoadError'
import { useAgentsInfo } from '@/hooks/useAgentsInfo'

import styles from './ProviderBadge.module.scss'

const ProviderBadge: FC = () => {
  const { data: agentsInfo, isPending, error, refetch } = useAgentsInfo()

  if (isPending) return <p className={styles.note}>Checking the LLM provider…</p>
  if (error) return <LoadError error={error} onRetry={() => void refetch()} />

  const { isConfigured, provider, modelId } = agentsInfo

  if (!isConfigured) {
    return (
      <div className={styles.provider}>
        <Badge tone="danger">{provider} · not configured</Badge>
        <div className={styles.banner} role="alert">
          <p className={styles.bannerTitle}>No LLM key</p>
          <p className={styles.bannerText}>
            The tracker works without it; only the agents are off. Set{' '}
            <code>GOOGLE_GENERATIVE_AI_API_KEY</code> in <code>.env</code>, or start the API with{' '}
            <code>LLM_PROVIDER=mock</code>, then restart the API.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.provider}>
      <Badge tone={provider === 'mock' ? 'warning' : 'info'}>
        {provider} · {modelId}
      </Badge>
      {provider === 'mock' && (
        <p className={styles.warning}>
          Mock provider: answers are pre-recorded, no real model is called.
        </p>
      )}
    </div>
  )
}

export { ProviderBadge }
