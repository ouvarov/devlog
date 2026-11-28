import type { DecomposeItem, DecomposeResponse } from '@devlog/shared'

import type { DecomposeAction, DecomposeState, ProposalItemDraft } from '@/types/decompose'

const IDLE_STATE: DecomposeState = { phase: 'idle' }

const toDraftItems = (items: readonly DecomposeItem[]): ProposalItemDraft[] =>
  items.map(({ title, description, priority, status }, key) => ({
    key,
    isIncluded: true,
    title,
    description,
    priority,
    status,
  }))

const toAnsweredState = (response: DecomposeResponse): DecomposeState => {
  const run = { meta: response.meta, trace: response.trace }
  if (response.kind === 'clarify') {
    return { phase: 'clarify', questions: response.questions, run, errors: null }
  }
  return {
    phase: 'proposal',
    items: toDraftItems(response.items),
    assumptions: response.assumptions,
    run,
    errors: null,
  }
}

const isStartable = ({ phase }: DecomposeState): boolean =>
  phase === 'idle' || phase === 'clarify' || phase === 'error'

const isClosable = ({ phase }: DecomposeState): boolean => phase !== 'creating'

const decomposeReducer = (state: DecomposeState, action: DecomposeAction): DecomposeState => {
  switch (action.type) {
    case 'reset':
      return IDLE_STATE
    case 'started':
      if (!isStartable(state)) return state
      return { phase: 'running', request: action.request, startedAt: action.startedAt }
    case 'answered':
      if (state.phase !== 'running') return state
      return toAnsweredState(action.response)
    case 'answers-invalid':
      if (state.phase !== 'clarify') return state
      return { ...state, errors: action.errors }
    case 'failed':
      if (state.phase !== 'running') return state
      return { phase: 'error', error: action.error, request: state.request }
    case 'item-changed':
      if (state.phase !== 'proposal') return state
      return {
        ...state,
        items: state.items.map((item) =>
          item.key === action.key ? { ...item, ...action.changes } : item,
        ),
      }
    case 'create-started':
      if (state.phase !== 'proposal') return state
      return { ...state, phase: 'creating', errors: null }
    case 'create-failed':
      if (state.phase !== 'proposal' && state.phase !== 'creating') return state
      return { ...state, phase: 'proposal', errors: action.errors }
    case 'created':
      if (state.phase !== 'creating') return state
      return { phase: 'done', createdCount: action.createdCount }
  }
}

export { decomposeReducer, IDLE_STATE, isClosable, toDraftItems }
