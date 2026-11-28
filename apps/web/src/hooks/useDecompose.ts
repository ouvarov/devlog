import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useReducer, useRef } from 'react'

import type { DecomposeRequest } from '@devlog/shared'

import { runDecompose } from '@/api/agents'
import { invalidateAgentsIfNotConfigured } from '@/api/invalidateAgents'
import { useCreateTasksBatch } from '@/hooks/useCreateTasksBatch'
import type { ProposalItemChanges } from '@/types/decompose'
import {
  getBatchErrors,
  getDecomposeErrorView,
  toBatchInput,
  toClarifiedRequest,
  toSkipRequest,
  toStartRequest,
} from '@/utils/decompose'
import { IDLE_STATE, decomposeReducer } from '@/utils/decomposeState'

const useDecompose = (taskId: number) => {
  const [state, dispatch] = useReducer(decomposeReducer, IDLE_STATE)
  const queryClient = useQueryClient()
  const { mutateAsync: createTasks } = useCreateTasksBatch()
  const sessionRef = useRef<AbortController | null>(null)

  const startSession = (): AbortSignal => {
    sessionRef.current?.abort()
    const session = new AbortController()
    sessionRef.current = session
    return session.signal
  }

  const run = async (request: DecomposeRequest) => {
    const signal = startSession()
    dispatch({ type: 'started', request, startedAt: Date.now() })

    try {
      const response = await runDecompose(request, signal)
      if (!signal.aborted) dispatch({ type: 'answered', response })
    } catch (error) {
      if (signal.aborted) return
      if (error instanceof Error) void invalidateAgentsIfNotConfigured(queryClient, error)
      dispatch({ type: 'failed', error: getDecomposeErrorView(error) })
    }
  }

  const start = (isSkippingQuestions: boolean) =>
    void run(toStartRequest(taskId, isSkippingQuestions))

  const answer = (answers: string[]) => {
    if (state.phase !== 'clarify') return
    const request = toClarifiedRequest(taskId, state.questions, answers)
    if (request.success) void run(request.data)
    else dispatch({ type: 'answers-invalid', errors: request.errors })
  }

  const skipQuestions = () => void run(toSkipRequest(taskId))

  const retry = () => {
    if (state.phase === 'error') void run(state.request)
  }

  const changeItem = (key: number, changes: ProposalItemChanges) =>
    dispatch({ type: 'item-changed', key, changes })

  const create = async () => {
    if (state.phase !== 'proposal') return
    const batch = toBatchInput(taskId, state.items)
    if (!batch.success) {
      dispatch({ type: 'create-failed', errors: batch.errors })
      return
    }

    // A sent batch may already be written, so it is not aborted; closing only drops the answer.
    const signal = startSession()
    dispatch({ type: 'create-started' })
    try {
      const result = await createTasks(batch.data)
      if (!signal.aborted) dispatch({ type: 'created', createdCount: result.created.length })
    } catch (error) {
      if (!signal.aborted) {
        dispatch({ type: 'create-failed', errors: getBatchErrors(error, state.items) })
      }
    }
  }

  const reset = () => {
    sessionRef.current?.abort()
    sessionRef.current = null
    dispatch({ type: 'reset' })
  }

  useEffect(() => () => sessionRef.current?.abort(), [])

  return {
    state,
    start,
    answer,
    skipQuestions,
    retry,
    changeItem,
    create: () => void create(),
    reset,
  }
}

export { useDecompose }
