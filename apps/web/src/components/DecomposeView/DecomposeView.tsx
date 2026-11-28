import { type FC, useEffect, useId, useRef } from 'react'

import { AgentRunMeta } from '@/components/AgentRunMeta/AgentRunMeta'
import { AgentRunning } from '@/components/AgentRunning/AgentRunning'
import { AgentTrace } from '@/components/AgentTrace/AgentTrace'
import { Button } from '@/components/Button/Button'
import { DecomposeClarify } from '@/components/DecomposeClarify/DecomposeClarify'
import { DecomposeError } from '@/components/DecomposeError/DecomposeError'
import { DecomposeProposal } from '@/components/DecomposeProposal/DecomposeProposal'
import { DecomposeStart } from '@/components/DecomposeStart/DecomposeStart'
import type { AgentRun, DecomposeState, ProposalItemChanges } from '@/types/decompose'
import {
  PHASE_LABELS,
  type PhaseFocus,
  getFormErrors,
  getPhaseFocus,
  getPhaseGroup,
} from '@/utils/decomposeFocus'
import { pluralize } from '@/utils/text'

import styles from './DecomposeView.module.scss'

type DecomposeViewProps = {
  state: DecomposeState
  maxSteps: number | null
  elapsedSeconds: number
  isNotConfigured: boolean
  onStart: (isSkippingQuestions: boolean) => void
  onAnswer: (answers: string[]) => void
  onSkipQuestions: () => void
  onItemChange: (key: number, changes: ProposalItemChanges) => void
  onCreate: () => void
  onRetry: () => void
  onClose: () => void
}

type RunDetailsProps = {
  run: AgentRun
  maxSteps: number | null
}

const RunDetails: FC<RunDetailsProps> = ({ run, maxSteps }) => (
  <div className={styles.run}>
    <AgentRunMeta meta={run.meta} maxSteps={maxSteps} />
    <AgentTrace steps={run.trace} />
  </div>
)

const findFocusTarget = (container: HTMLElement, focus: PhaseFocus): HTMLElement => {
  const selector =
    focus === 'invalid' ? '[aria-invalid="true"], [role="alert"]' : '[data-phase-focus]'
  const target = container.querySelector(selector)
  return target instanceof HTMLElement ? target : container
}

const DecomposeView: FC<DecomposeViewProps> = ({
  state,
  maxSteps,
  elapsedSeconds,
  isNotConfigured,
  onStart,
  onAnswer,
  onSkipQuestions,
  onItemChange,
  onCreate,
  onRetry,
  onClose,
}) => {
  const doneId = useId()
  const phaseRef = useRef<HTMLDivElement>(null)

  const formErrors = getFormErrors(state)

  useEffect(() => {
    const container = phaseRef.current
    const focus = getPhaseFocus(state.phase, formErrors !== null)
    if (!container || focus === 'none') return
    findFocusTarget(container, focus).focus()
  }, [state.phase, formErrors])

  return (
    <div className={styles.view}>
      <AgentRunning
        isRunning={state.phase === 'running'}
        elapsedSeconds={elapsedSeconds}
        maxSteps={maxSteps}
      />

      <div
        key={getPhaseGroup(state.phase)}
        ref={phaseRef}
        className={styles.phase}
        tabIndex={-1}
        role="group"
        aria-label={PHASE_LABELS[state.phase]}
      >
        {state.phase === 'idle' && (
          <DecomposeStart isNotConfigured={isNotConfigured} onStart={onStart} onCancel={onClose} />
        )}

        {state.phase === 'running' && (
          <div className={styles.actions}>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        )}

        {state.phase === 'clarify' && (
          <>
            <DecomposeClarify
              questions={state.questions}
              errors={state.errors}
              onSubmit={onAnswer}
              onSkip={onSkipQuestions}
              onCancel={onClose}
            />
            <RunDetails run={state.run} maxSteps={maxSteps} />
          </>
        )}

        {(state.phase === 'proposal' || state.phase === 'creating') && (
          <>
            <DecomposeProposal
              items={state.items}
              assumptions={state.assumptions}
              errors={state.errors}
              isCreating={state.phase === 'creating'}
              onItemChange={onItemChange}
              onCreate={onCreate}
              onCancel={onClose}
            />
            <RunDetails run={state.run} maxSteps={maxSteps} />
          </>
        )}

        {state.phase === 'done' && (
          <div className={styles.done}>
            <p id={doneId} className={styles.message}>
              {pluralize(state.createdCount, 'subtask')} created.
            </p>
            <div className={styles.actions}>
              <Button
                variant="primary"
                aria-describedby={doneId}
                data-phase-focus
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {state.phase === 'error' && (
          <DecomposeError error={state.error} onRetry={onRetry} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

export { DecomposeView }
