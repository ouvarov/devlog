'use client'

import type { FC } from 'react'

import { Button, type ButtonVariant } from '@/components/Button/Button'
import { Dialog } from '@/components/Dialog/Dialog'

import styles from './ConfirmDialog.module.scss'

type ConfirmDialogProps = {
  isOpen: boolean
  heading: string
  message: string
  confirmLabel: string
  confirmVariant?: ButtonVariant
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  heading,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => (
  <Dialog isOpen={isOpen} heading={heading} onClose={onCancel}>
    <p className={styles.message}>{message}</p>
    <div className={styles.actions}>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant={confirmVariant} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  </Dialog>
)

export { ConfirmDialog }
