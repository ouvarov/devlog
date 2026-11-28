import { type DecomposeClarify, DecomposeClarifySchema } from '@devlog/shared'

import { formatIssue } from '../runtime/format-issue.js'
import type { SubmitResult } from '../runtime/submit-result.js'

const validateClarifyQuestions = (input: unknown): SubmitResult<DecomposeClarify> => {
  const parsed = DecomposeClarifySchema.safeParse(input)
  if (!parsed.success) return { accepted: false, errors: parsed.error.issues.map(formatIssue) }

  return { accepted: true, value: parsed.data }
}

export { validateClarifyQuestions }
