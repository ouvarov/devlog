import { useState } from 'react'

type ResolveConfirmation = (isConfirmed: boolean) => void

const useConfirmation = () => {
  const [resolve, setResolve] = useState<ResolveConfirmation | null>(null)

  const askConfirmation = () =>
    new Promise<boolean>((resolvePromise) => setResolve(() => resolvePromise))

  const settle = (isConfirmed: boolean) => {
    resolve?.(isConfirmed)
    setResolve(null)
  }

  return {
    askConfirmation,
    isOpen: resolve !== null,
    confirm: () => settle(true),
    cancel: () => settle(false),
  }
}

export { useConfirmation }
