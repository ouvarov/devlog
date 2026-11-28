'use client'

import { type FC, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { DecomposeDialog } from '@/components/DecomposeDialog/DecomposeDialog'

type DecomposeButtonProps = {
  taskId: number
}

const DecomposeButton: FC<DecomposeButtonProps> = ({ taskId }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Break into subtasks</Button>
      <DecomposeDialog taskId={taskId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export { DecomposeButton }
