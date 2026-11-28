'use client'

import type { FC, FormEvent } from 'react'

import { Button } from '@/components/Button/Button'
import { DecomposeProposalItem } from '@/components/DecomposeProposalItem/DecomposeProposalItem'
import type { ProposalErrors, ProposalItemChanges, ProposalItemDraft } from '@/types/decompose'
import { getIncludedItems } from '@/utils/decompose'
import { pluralize } from '@/utils/text'

import styles from './DecomposeProposal.module.scss'

type DecomposeProposalProps = {
  items: readonly ProposalItemDraft[]
  assumptions: readonly string[]
  errors: ProposalErrors | null
  isCreating: boolean
  onItemChange: (key: number, changes: ProposalItemChanges) => void
  onCreate: () => void
  onCancel: () => void
}

const DecomposeProposal: FC<DecomposeProposalProps> = ({
  items,
  assumptions,
  errors,
  isCreating,
  onItemChange,
  onCreate,
  onCancel,
}) => {
  const includedCount = getIncludedItems(items).length

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCreate()
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <fieldset className={styles.body} disabled={isCreating}>
        <ul className={styles.items}>
          {items.map((item, index) => (
            <DecomposeProposalItem
              key={item.key}
              position={index + 1}
              title={item.title}
              description={item.description}
              priority={item.priority}
              status={item.status}
              isIncluded={item.isIncluded}
              error={errors?.items[item.key]}
              onChange={(changes) => onItemChange(item.key, changes)}
            />
          ))}
        </ul>

        {assumptions.length > 0 && (
          <section className={styles.assumptions}>
            <h3 className={styles.heading}>Assumptions</h3>
            <ul className={styles.assumptionList}>
              {assumptions.map((assumption, index) => (
                <li key={index}>{assumption}</li>
              ))}
            </ul>
          </section>
        )}

        {errors?.message && (
          <p className={styles.error} role="alert" tabIndex={-1}>
            {errors.message}
          </p>
        )}

        <div className={styles.actions}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={includedCount === 0}>
            {isCreating ? 'Creating…' : `Create ${pluralize(includedCount, 'subtask')}`}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

export { DecomposeProposal }
