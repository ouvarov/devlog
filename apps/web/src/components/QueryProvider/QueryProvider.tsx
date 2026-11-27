'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type FC, type ReactNode, useState } from 'react'

import { ApiRequestError } from '@/api/client'

type QueryProviderProps = {
  children: ReactNode
}

const QUERY_RETRY_COUNT = 1
const FIRST_SERVER_ERROR_STATUS = 500

const isClientError = (error: Error): boolean =>
  error instanceof ApiRequestError &&
  error.status !== null &&
  error.status < FIRST_SERVER_ERROR_STATUS

const shouldRetry = (failureCount: number, error: Error): boolean =>
  failureCount < QUERY_RETRY_COUNT && !isClientError(error)

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
    },
  })

const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(createQueryClient)

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export { QueryProvider }
