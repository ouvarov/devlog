import { useQuery } from '@tanstack/react-query'

import { getAgentsInfo } from '@/api/agents'
import { AGENTS_QUERY_KEY } from '@/api/queryKeys'

const useAgentsInfo = () =>
  useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: ({ signal }) => getAgentsInfo(signal),
  })

export { useAgentsInfo }
