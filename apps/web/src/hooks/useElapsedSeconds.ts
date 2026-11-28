import { useEffect, useState } from 'react'

import { MS_PER_SECOND, getElapsedSeconds } from '@/utils/elapsed'

const useElapsedSeconds = (startedAt: number | null): number => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null) return
    const timer = setInterval(() => setNow(Date.now()), MS_PER_SECOND)
    return () => clearInterval(timer)
  }, [startedAt])

  return getElapsedSeconds(startedAt, now)
}

export { useElapsedSeconds }
