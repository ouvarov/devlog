import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useReducer, useState } from 'react'

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
import { createRunSession, settleUnlessAborted } from '@/utils/runSession'

const useDecompose = (taskId: number) => {
  const [state, dispatch] = useReducer(decomposeReducer, IDLE_STATE)
  const queryClient = useQueryClient()
  const { mutateAsync: createTasks } = useCreateTasksBatch()
  const [session] = useState(createRunSession)

  const run = (request: DecomposeRequest) => {
    const signal = session.start()
    dispatch({ type: 'started', request, startedAt: Date.now() })

    return settleUnlessAborted(signal, runDecompose(request, signal), {
      onValue: (response) => dispatch({ type: 'answered', response }),
      onError: (error) => {
        if (error instanceof Error) void invalidateAgentsIfNotConfigured(queryClient, error)
        dispatch({ type: 'failed', error: getDecomposeErrorView(error) })
      },
    })
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

  const create = () => {
    if (state.phase !== 'proposal') return
    const batch = toBatchInput(taskId, state.items)
    if (!batch.success) {
      dispatch({ type: 'create-failed', errors: batch.errors })
      return
    }

    // A sent batch may already be written, so it is not aborted; closing only drops the answer.
    const signal = session.start()
    const { items } = state
    dispatch({ type: 'create-started' })
    return settleUnlessAborted(signal, createTasks(batch.data), {
      onValue: (result) => dispatch({ type: 'created', createdCount: result.created.length }),
      onError: (error) => dispatch({ type: 'create-failed', errors: getBatchErrors(error, items) }),
    })
  }

  const reset = () => {
    session.close()
    dispatch({ type: 'reset' })
  }

  useEffect(() => () => session.close(), [session])

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
