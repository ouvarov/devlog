import { useEffect, useState } from 'react'

import { HealthResponseSchema } from '@devlog/shared'

import { API_URL } from '@/config/api'

type ApiHealth = 'checking' | 'online' | 'offline'

const HEALTH_TIMEOUT_MS = 5000

const fetchApiHealth = async (signal: AbortSignal): Promise<ApiHealth> => {
  const response = await fetch(`${API_URL}/health`, { signal })
  if (!response.ok) return 'offline'

  const body: unknown = await response.json()
  return HealthResponseSchema.safeParse(body).success ? 'online' : 'offline'
}

const useApiHealth = (): ApiHealth => {
  const [health, setHealth] = useState<ApiHealth>('checking')

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(HEALTH_TIMEOUT_MS)])

    fetchApiHealth(signal)
      .then(setHealth)
      .catch(() => {
        if (!controller.signal.aborted) setHealth('offline')
      })

    return () => controller.abort()
  }, [])

  return health
}

export { useApiHealth }
export type { ApiHealth }
