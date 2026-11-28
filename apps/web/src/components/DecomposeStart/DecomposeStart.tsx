'use client'

import { type FC, useId, useState } from 'react'

import { CLARIFY_MAX_QUESTIONS, PROPOSAL_MAX_ITEMS, PROPOSAL_MIN_ITEMS } from '@devlog/shared'

import { Button } from '@/components/Button/Button'

import styles from './DecomposeStart.module.scss'

type DecomposeStartProps = {
  isNotConfigured: boolean
  onStart: (isSkippingQuestions: boolean) => void
  onCancel: () => void
}

const DecomposeStart: FC<DecomposeStartProps> = ({ isNotConfigured, onStart, onCancel }) => {
  const [isSkippingQuestions, setIsSkippingQuestions] = useState(false)
  const optionId = useId()
  const hintId = useId()

  return (
    <div className={styles.start}>
      <p className={styles.note}>
        The agent proposes {PROPOSAL_MIN_ITEMS}–{PROPOSAL_MAX_ITEMS} subtasks. If the task is too
        vague, it first asks up to {CLARIFY_MAX_QUESTIONS} questions. Nothing is created until you
        confirm.
      </p>
      <div className={styles.option}>
        <input
          id={optionId}
          type="checkbox"
          checked={isSkippingQuestions}
          onChange={(event) => setIsSkippingQuestions(event.target.checked)}
        />
        <label htmlFor={optionId}>Don&apos;t ask questions, state assumptions instead</label>
      </div>
      {isNotConfigured && (
        <p id={hintId} className={styles.hint}>
          Set an LLM key or LLM_PROVIDER=mock to run agents.
        </p>
      )}
      <div className={styles.actions}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary"
          disabled={isNotConfigured}
          aria-describedby={isNotConfigured ? hintId : undefined}
          onClick={() => onStart(isSkippingQuestions)}
        >
          Break down
        </Button>
      </div>
    </div>
  )
}

export { DecomposeStart }
