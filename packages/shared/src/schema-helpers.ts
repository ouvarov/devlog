import type { z } from 'zod'

const hasNoIssues = (payload: z.core.ParsePayload): boolean => payload.issues.length === 0

export { hasNoIssues }
