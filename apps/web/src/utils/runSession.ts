type RunSession = {
  start: () => AbortSignal
  close: () => void
}

type SettleHandlers<T> = {
  onValue: (value: T) => void
  onError: (error: unknown) => void
}

const createRunSession = (): RunSession => {
  let current: AbortController | null = null

  return {
    start: () => {
      current?.abort()
      current = new AbortController()
      return current.signal
    },
    close: () => {
      current?.abort()
      current = null
    },
  }
}

const settleUnlessAborted = async <T>(
  signal: AbortSignal,
  request: Promise<T>,
  { onValue, onError }: SettleHandlers<T>,
): Promise<void> => {
  try {
    const value = await request
    if (!signal.aborted) onValue(value)
  } catch (error) {
    if (!signal.aborted) onError(error)
  }
}

export { createRunSession, settleUnlessAborted }
export type { RunSession }
