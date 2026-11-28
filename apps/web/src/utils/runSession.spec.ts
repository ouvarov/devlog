import { describe, expect, it, vi } from 'vitest'

import { createRunSession, settleUnlessAborted } from './runSession'

const createDeferred = <T>() => {
  let resolve: (value: T) => void = () => {}
  let reject: (error: unknown) => void = () => {}
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

const settle = (signal: AbortSignal, promise: Promise<string>) => {
  const onValue = vi.fn()
  const onError = vi.fn()
  const settled = settleUnlessAborted(signal, promise, { onValue, onError })
  return { settled, onValue, onError }
}

describe('run session', () => {
  it('delivers the answer of the current run', async () => {
    const session = createRunSession()
    const answer = createDeferred<string>()
    const { settled, onValue } = settle(session.start(), answer.promise)

    answer.resolve('proposal')
    await settled

    expect(onValue).toHaveBeenCalledWith('proposal')
  })

  it('ignores an answer that arrives after the dialog closed', async () => {
    const session = createRunSession()
    const answer = createDeferred<string>()
    const { settled, onValue, onError } = settle(session.start(), answer.promise)

    session.close()
    answer.resolve('late proposal')
    await settled

    expect(onValue).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('ignores the abort error of a closed run', async () => {
    const session = createRunSession()
    const answer = createDeferred<string>()
    const signal = session.start()
    const { settled, onError } = settle(signal, answer.promise)

    session.close()
    answer.reject(new DOMException('Aborted', 'AbortError'))
    await settled

    expect(signal.aborted).toBe(true)
    expect(onError).not.toHaveBeenCalled()
  })

  it('aborts the previous run when a new one starts', async () => {
    const session = createRunSession()
    const first = createDeferred<string>()
    const second = createDeferred<string>()
    const firstRun = settle(session.start(), first.promise)
    const secondRun = settle(session.start(), second.promise)

    first.resolve('stale')
    second.resolve('fresh')
    await Promise.all([firstRun.settled, secondRun.settled])

    expect(firstRun.onValue).not.toHaveBeenCalled()
    expect(secondRun.onValue).toHaveBeenCalledWith('fresh')
  })

  it('reports a failure of the current run', async () => {
    const session = createRunSession()
    const answer = createDeferred<string>()
    const { settled, onError } = settle(session.start(), answer.promise)
    const failure = new Error('422')

    answer.reject(failure)
    await settled

    expect(onError).toHaveBeenCalledWith(failure)
  })
})
