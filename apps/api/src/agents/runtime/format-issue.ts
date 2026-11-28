import type { z } from 'zod'

const formatIssue = (issue: z.core.$ZodIssue): string => {
  const path = issue.path.map(String).join('.')
  return path ? `${path}: ${issue.message}` : issue.message
}

export { formatIssue }
