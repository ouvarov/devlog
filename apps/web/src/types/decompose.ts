import type {
  AgentMeta,
  AgentTraceStep,
  DecomposeRequest,
  DecomposeResponse,
  TaskPriority,
  TaskStatus,
} from '@devlog/shared'

type ValidationResult<T, E> = { success: true; data: T } | { success: false; errors: E }

type AgentRun = {
  meta: AgentMeta
  trace: AgentTraceStep[]
}

type ProposalItemDraft = {
  key: number
  isIncluded: boolean
  title: string
  description: string | undefined
  priority: TaskPriority
  status: TaskStatus
}

type ProposalItemChanges = Partial<
  Pick<ProposalItemDraft, 'isIncluded' | 'title' | 'priority' | 'status'>
>

type ProposalErrors = {
  items: Partial<Record<number, string>>
  message: string | null
}

type ClarifyErrors = {
  answers: Partial<Record<number, string>>
  message: string | null
}

type DecomposeErrorView = {
  title: string
  message: string
  trace: AgentTraceStep[] | null
  canRetry: boolean
}

type ProposalStage = {
  items: ProposalItemDraft[]
  assumptions: string[]
  run: AgentRun
  errors: ProposalErrors | null
}

type DecomposeState =
  | { phase: 'idle' }
  | { phase: 'running'; request: DecomposeRequest; startedAt: number }
  | { phase: 'clarify'; questions: string[]; run: AgentRun; errors: ClarifyErrors | null }
  | ({ phase: 'proposal' } & ProposalStage)
  | ({ phase: 'creating' } & ProposalStage)
  | { phase: 'done'; createdCount: number }
  | { phase: 'error'; error: DecomposeErrorView; request: DecomposeRequest }

type DecomposeAction =
  | { type: 'started'; request: DecomposeRequest; startedAt: number }
  | { type: 'answered'; response: DecomposeResponse }
  | { type: 'answers-invalid'; errors: ClarifyErrors }
  | { type: 'failed'; error: DecomposeErrorView }
  | { type: 'item-changed'; key: number; changes: ProposalItemChanges }
  | { type: 'create-started' }
  | { type: 'create-failed'; errors: ProposalErrors }
  | { type: 'created'; createdCount: number }
  | { type: 'reset' }

export type {
  AgentRun,
  ClarifyErrors,
  DecomposeAction,
  DecomposeErrorView,
  DecomposeState,
  ProposalErrors,
  ProposalItemChanges,
  ProposalItemDraft,
  ValidationResult,
}
