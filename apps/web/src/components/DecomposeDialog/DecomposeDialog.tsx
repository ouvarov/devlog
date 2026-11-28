'use client'

import type { FC } from 'react'

import { DecomposeView } from '@/components/DecomposeView/DecomposeView'
import { Dialog } from '@/components/Dialog/Dialog'
import { useAgentsInfo } from '@/hooks/useAgentsInfo'
import { useDecompose } from '@/hooks/useDecompose'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { getMaxSteps } from '@/utils/agents'
import { isClosable } from '@/utils/decomposeState'

type DecomposeDialogProps = {
  taskId: number
  isOpen: boolean
  onClose: () => void
}

const DecomposeDialog: FC<DecomposeDialogProps> = ({ taskId, isOpen, onClose }) => {
  const decompose = useDecompose(taskId)
  const { data: agentsInfo } = useAgentsInfo()
  const { state } = decompose
  const elapsedSeconds = useElapsedSeconds(state.phase === 'running' ? state.startedAt : null)

  const handleClose = () => {
    if (!isClosable(state)) return
    decompose.reset()
    onClose()
  }

  return (
    <Dialog isOpen={isOpen} heading="Break into subtasks" onClose={handleClose}>
      <DecomposeView
        state={state}
        maxSteps={getMaxSteps(agentsInfo, 'decompose')}
        elapsedSeconds={elapsedSeconds}
        isNotConfigured={agentsInfo?.isConfigured === false}
        onStart={decompose.start}
        onAnswer={decompose.answer}
        onSkipQuestions={decompose.skipQuestions}
        onItemChange={decompose.changeItem}
        onCreate={decompose.create}
        onRetry={decompose.retry}
        onClose={handleClose}
      />
    </Dialog>
  )
}

export { DecomposeDialog }
