'use client'

import { type FC, type ReactNode, type SyntheticEvent, useEffect, useId, useRef } from 'react'

import styles from './Dialog.module.scss'

type DialogProps = {
  isOpen: boolean
  heading: string
  onClose: () => void
  children: ReactNode
}

const Dialog: FC<DialogProps> = ({ isOpen, heading, onClose, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingId = useId()

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    onClose()
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={headingId}
      onCancel={handleCancel}
    >
      {isOpen && (
        <>
          <h2 id={headingId} className={styles.heading}>
            {heading}
          </h2>
          {children}
        </>
      )}
    </dialog>
  )
}

export { Dialog }
