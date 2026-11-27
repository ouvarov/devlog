import { useQuery } from '@tanstack/react-query'

import { getHealth } from '@/api/health'
import { HEALTH_QUERY_KEY } from '@/api/queryKeys'

type ApiHealth = 'checking' | 'online' | 'offline'

const HEALTH_TIMEOUT_MS = 5000
const HEALTH_RETRY_COUNT = 2

const useApiHealth = (): ApiHealth => {
  const { isPending, isSuccess } = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: ({ signal }) =>
      getHealth(AbortSignal.any([signal, AbortSignal.timeout(HEALTH_TIMEOUT_MS)])),
    retry: HEALTH_RETRY_COUNT,
  })

  if (isPending) return 'checking'
  return isSuccess ? 'online' : 'offline'
}

export { useApiHealth }
export type { ApiHealth }
