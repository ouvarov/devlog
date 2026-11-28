import { useEffect, useState } from 'react'

const TICK_MS = 1000

const useElapsedSeconds = (startedAt: number | null): number => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null) return
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [startedAt])

  if (startedAt === null) return 0
  return Math.max(0, Math.floor((now - startedAt) / TICK_MS))
}

export { useElapsedSeconds }
