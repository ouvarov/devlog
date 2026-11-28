import { type FC, useId } from 'react'

import { AgentRunMeta } from '@/components/AgentRunMeta/AgentRunMeta'
import { AgentRunning } from '@/components/AgentRunning/AgentRunning'
import { AgentTrace } from '@/components/AgentTrace/AgentTrace'
import { Button } from '@/components/Button/Button'
import { DecomposeClarify } from '@/components/DecomposeClarify/DecomposeClarify'
import { DecomposeError } from '@/components/DecomposeError/DecomposeError'
import { DecomposeProposal } from '@/components/DecomposeProposal/DecomposeProposal'
import { DecomposeStart } from '@/components/DecomposeStart/DecomposeStart'
import type {
  AgentRun,
  ClarifyErrors,
  DecomposeState,
  ProposalItemChanges,
} from '@/types/decompose'
import { pluralize } from '@/utils/text'

import styles from './DecomposeView.module.scss'

type DecomposeViewProps = {
  state: DecomposeState
  maxSteps: number | null
  elapsedSeconds: number
  isNotConfigured: boolean
  onStart: (isSkippingQuestions: boolean) => void
  onAnswer: (answers: string[]) => ClarifyErrors | null
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

  return (
    <div className={styles.view}>
      <AgentRunning
        isRunning={state.phase === 'running'}
        elapsedSeconds={elapsedSeconds}
        maxSteps={maxSteps}
      />

      {state.phase === 'idle' && (
        <DecomposeStart isNotConfigured={isNotConfigured} onStart={onStart} onCancel={onClose} />
      )}

      {state.phase === 'running' && (
        <div className={styles.actions}>
          <Button autoFocus onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}

      {state.phase === 'clarify' && (
        <>
          <DecomposeClarify
            questions={state.questions}
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
            <Button variant="primary" autoFocus aria-describedby={doneId} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}

      {state.phase === 'error' && (
        <DecomposeError error={state.error} onRetry={onRetry} onClose={onClose} />
      )}
    </div>
  )
}

export { DecomposeView }
