const MS_PER_SECOND = 1000

const getElapsedSeconds = (startedAt: number | null, now: number): number =>
  startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / MS_PER_SECOND))

export { getElapsedSeconds, MS_PER_SECOND }
