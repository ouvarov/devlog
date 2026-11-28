import { z } from 'zod'

import { AgentMetaSchema, AgentTraceStepSchema } from './agent.js'
import { hasNoIssues } from './schema-helpers.js'
import {
  TaskDescriptionSchema,
  TaskIdSchema,
  TaskPrioritySchema,
  TaskStatusSchema,
  TaskTitleSchema,
} from './task.js'

const CLARIFY_MIN_QUESTIONS = 1
const CLARIFY_MAX_QUESTIONS = 3
const CLARIFY_QUESTION_MAX_LENGTH = 300
const CLARIFY_ANSWER_MAX_LENGTH = 500
const PROPOSAL_MIN_ITEMS = 3
const PROPOSAL_MAX_ITEMS = 8
const PROPOSAL_MAX_ASSUMPTIONS = 5
const ASSUMPTION_MAX_LENGTH = 300

const ClarifyQuestionSchema = z.string().trim().min(1).max(CLARIFY_QUESTION_MAX_LENGTH)
const ClarifyAnswerSchema = z.string().trim().min(1).max(CLARIFY_ANSWER_MAX_LENGTH)
const ClarifyQuestionsSchema = z
  .array(ClarifyQuestionSchema)
  .min(CLARIFY_MIN_QUESTIONS)
  .max(CLARIFY_MAX_QUESTIONS)

const DecomposeClarificationSchema = z
  .object({
    questions: ClarifyQuestionsSchema,
    answers: z.array(ClarifyAnswerSchema).min(CLARIFY_MIN_QUESTIONS).max(CLARIFY_MAX_QUESTIONS),
  })
  .strict()
  .refine(({ questions, answers }) => questions.length === answers.length, {
    message: 'Each question needs exactly one answer',
    path: ['answers'],
    when: hasNoIssues,
  })

const DecomposeRequestSchema = z
  .object({
    taskId: TaskIdSchema,
    clarification: DecomposeClarificationSchema.optional(),
    skipClarification: z.boolean().optional(),
  })
  .strict()
  .refine(
    ({ clarification, skipClarification }) =>
      clarification === undefined || skipClarification === undefined,
    {
      message: 'Send either clarification or skipClarification, not both',
      path: ['skipClarification'],
      when: hasNoIssues,
    },
  )

const DecomposeItemSchema = z
  .object({
    title: TaskTitleSchema,
    description: TaskDescriptionSchema.optional(),
    priority: TaskPrioritySchema,
    status: TaskStatusSchema,
  })
  .strict()

const DecomposeProposalSchema = z
  .object({
    items: z.array(DecomposeItemSchema).min(PROPOSAL_MIN_ITEMS).max(PROPOSAL_MAX_ITEMS),
    assumptions: z
      .array(z.string().trim().min(1).max(ASSUMPTION_MAX_LENGTH))
      .max(PROPOSAL_MAX_ASSUMPTIONS),
  })
  .strict()

const DecomposeClarifySchema = z.object({ questions: ClarifyQuestionsSchema }).strict()

const DecomposeRunSchema = z.object({
  meta: AgentMetaSchema,
  trace: z.array(AgentTraceStepSchema),
})

const DecomposeResponseSchema = z.discriminatedUnion('kind', [
  DecomposeClarifySchema.extend({ kind: z.literal('clarify'), ...DecomposeRunSchema.shape }).strict(),
  DecomposeProposalSchema.extend({
    kind: z.literal('proposal'),
    ...DecomposeRunSchema.shape,
  }).strict(),
])

type DecomposeClarification = z.infer<typeof DecomposeClarificationSchema>
type DecomposeRequest = z.infer<typeof DecomposeRequestSchema>
type DecomposeItem = z.infer<typeof DecomposeItemSchema>
type DecomposeProposal = z.infer<typeof DecomposeProposalSchema>
type DecomposeClarify = z.infer<typeof DecomposeClarifySchema>
type DecomposeResponse = z.infer<typeof DecomposeResponseSchema>

export {
  ASSUMPTION_MAX_LENGTH,
  CLARIFY_ANSWER_MAX_LENGTH,
  CLARIFY_MAX_QUESTIONS,
  CLARIFY_MIN_QUESTIONS,
  CLARIFY_QUESTION_MAX_LENGTH,
  DecomposeClarificationSchema,
  DecomposeClarifySchema,
  DecomposeItemSchema,
  DecomposeProposalSchema,
  DecomposeRequestSchema,
  DecomposeResponseSchema,
  PROPOSAL_MAX_ASSUMPTIONS,
  PROPOSAL_MAX_ITEMS,
  PROPOSAL_MIN_ITEMS,
}
export type {
  DecomposeClarification,
  DecomposeClarify,
  DecomposeItem,
  DecomposeProposal,
  DecomposeRequest,
  DecomposeResponse,
}
