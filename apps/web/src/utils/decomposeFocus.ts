import type { ClarifyErrors, DecomposeState, ProposalErrors } from '@/types/decompose'

type DecomposePhase = DecomposeState['phase']

type PhaseFocus = 'none' | 'phase' | 'invalid'

const PHASE_LABELS = {
  idle: 'Before the run',
  running: 'The agent is running',
  clarify: 'Questions from the agent',
  proposal: 'Proposed subtasks',
  creating: 'Creating the subtasks',
  done: 'Subtasks created',
  error: 'The run failed',
} satisfies Record<DecomposePhase, string>

const getFormErrors = (state: DecomposeState): ClarifyErrors | ProposalErrors | null =>
  state.phase === 'clarify' || state.phase === 'proposal' ? state.errors : null

const getPhaseFocus = (phase: DecomposePhase, hasFormErrors: boolean): PhaseFocus => {
  if (phase === 'idle') return 'none'
  if (hasFormErrors) return 'invalid'
  return 'phase'
}

const getPhaseGroup = (phase: DecomposePhase): DecomposePhase =>
  phase === 'creating' ? 'proposal' : phase

export { getFormErrors, getPhaseFocus, getPhaseGroup, PHASE_LABELS }
export type { PhaseFocus }
