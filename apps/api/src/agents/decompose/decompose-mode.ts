import type { DecomposeRequest } from '@devlog/shared'

type DecomposeMode = 'may-ask' | 'answered' | 'skip-questions'

const decomposeModeOf = (request: DecomposeRequest): DecomposeMode => {
  if (request.clarification) return 'answered'
  if (request.skipClarification) return 'skip-questions'
  return 'may-ask'
}

export { decomposeModeOf }
export type { DecomposeMode }
