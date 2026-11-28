'use client'

import { type FC, useId } from 'react'

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
  type TaskPriority,
  type TaskStatus,
} from '@devlog/shared'

import { PRIORITY_LABELS, STATUS_LABELS } from '@/config/taskDisplay'
import type { ProposalItemChanges } from '@/types/decompose'
import { pickOption } from '@/utils/options'

import styles from './DecomposeProposalItem.module.scss'

type DecomposeProposalItemProps = {
  position: number
  title: string
  description: string | undefined
  priority: TaskPriority
  status: TaskStatus
  isIncluded: boolean
  error: string | undefined
  onChange: (changes: ProposalItemChanges) => void
}

const DecomposeProposalItem: FC<DecomposeProposalItemProps> = ({
  position,
  title,
  description,
  priority,
  status,
  isIncluded,
  error,
  onChange,
}) => {
  const itemId = useId()
  const errorId = `${itemId}-error`

  return (
    <li className={isIncluded ? styles.item : styles.excluded}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          <input
            id={`${itemId}-include`}
            type="checkbox"
            checked={isIncluded}
            onChange={(event) => onChange({ isIncluded: event.target.checked })}
          />
          <label htmlFor={`${itemId}-include`}>Create subtask {position}</label>
          {!isIncluded && <span className={styles.skipped}>Not created</span>}
        </legend>

        <div className={styles.field}>
          <label htmlFor={`${itemId}-title`}>Title</label>
          <input
            id={`${itemId}-title`}
            className={styles.control}
            value={title}
            maxLength={TASK_TITLE_MAX_LENGTH}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange({ title: event.target.value })}
          />
          {error && (
            <p id={errorId} className={styles.error}>
              {error}
            </p>
          )}
        </div>

        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={`${itemId}-status`}>Status</label>
            <select
              id={`${itemId}-status`}
              className={styles.control}
              value={status}
              onChange={(event) => {
                const picked = pickOption(TASK_STATUSES, event.target.value)
                if (picked) onChange({ status: picked })
              }}
            >
              {TASK_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${itemId}-priority`}>Priority</label>
            <select
              id={`${itemId}-priority`}
              className={styles.control}
              value={priority}
              onChange={(event) => {
                const picked = pickOption(TASK_PRIORITIES, event.target.value)
                if (picked) onChange({ priority: picked })
              }}
            >
              {TASK_PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {PRIORITY_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
    </li>
  )
}

export { DecomposeProposalItem }
