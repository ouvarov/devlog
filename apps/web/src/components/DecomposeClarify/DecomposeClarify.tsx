'use client'

import { type FC, type FormEvent, useId } from 'react'

import { CLARIFY_ANSWER_MAX_LENGTH } from '@devlog/shared'

import { Button } from '@/components/Button/Button'
import type { ClarifyErrors } from '@/types/decompose'

import styles from './DecomposeClarify.module.scss'

type DecomposeClarifyProps = {
  questions: readonly string[]
  errors: ClarifyErrors | null
  onSubmit: (answers: string[]) => void
  onSkip: () => void
  onCancel: () => void
}

const getAnswerName = (index: number): string => `answer-${index}`

const readAnswers = (form: HTMLFormElement, count: number): string[] => {
  const formData = new FormData(form)
  return Array.from({ length: count }, (_, index) => {
    const value = formData.get(getAnswerName(index))
    return typeof value === 'string' ? value : ''
  })
}

const DecomposeClarify: FC<DecomposeClarifyProps> = ({
  questions,
  errors,
  onSubmit,
  onSkip,
  onCancel,
}) => {
  const formId = useId()

  const getFieldId = (index: number) => `${formId}-${index}`
  const getErrorId = (index: number) => `${formId}-${index}-error`

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(readAnswers(event.currentTarget, questions.length))
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <p className={styles.note}>The agent needs a few answers before it can split the task.</p>

      {questions.map((question, index) => {
        const error = errors?.answers[index]
        return (
          <div key={index} className={styles.field}>
            <label htmlFor={getFieldId(index)} className={styles.question}>
              {question}
            </label>
            <textarea
              id={getFieldId(index)}
              name={getAnswerName(index)}
              className={styles.control}
              rows={2}
              required
              maxLength={CLARIFY_ANSWER_MAX_LENGTH}
              autoFocus={index === 0}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? getErrorId(index) : undefined}
            />
            {error && (
              <p id={getErrorId(index)} className={styles.error}>
                {error}
              </p>
            )}
          </div>
        )
      })}

      {errors?.message && (
        <p className={styles.error} role="alert">
          {errors.message}
        </p>
      )}

      <div className={styles.actions}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onSkip}>Skip questions</Button>
        <Button type="submit" variant="primary">
          Continue
        </Button>
      </div>
    </form>
  )
}

export { DecomposeClarify }
