import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getTaskKey } from '@/api/queryKeys'

import { getCreateTasksBatchOptions } from './useCreateTasksBatch'

const queryClient = new QueryClient()

describe('getCreateTasksBatchOptions', () => {
  afterEach(() => {
    queryClient.clear()
  })

  it('refetches the parent task after the batch is created', async () => {
    const getParent = vi.fn().mockResolvedValue({ id: 4 })
    await queryClient.fetchQuery({ queryKey: getTaskKey(4), queryFn: getParent })

    await getCreateTasksBatchOptions(queryClient).onSuccess()

    expect(getParent).toHaveBeenCalledTimes(2)
  })
})
