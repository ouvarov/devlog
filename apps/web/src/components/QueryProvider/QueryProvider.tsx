'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type FC, type ReactNode, useState } from 'react'

type QueryProviderProps = {
  children: ReactNode
}

const QUERY_RETRY_COUNT = 1

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: QUERY_RETRY_COUNT },
    },
  })

const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(createQueryClient)

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export { QueryProvider }
