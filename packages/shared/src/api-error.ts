import { z } from 'zod'

const API_ERROR_CODES = ['VALIDATION_FAILED', 'NOT_FOUND', 'CONFLICT', 'INTERNAL'] as const

const ApiErrorCodeSchema = z.enum(API_ERROR_CODES)

const ApiIssueSchema = z
  .object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
  })
  .strict()

const ApiErrorSchema = z
  .object({
    statusCode: z.int(),
    code: ApiErrorCodeSchema,
    message: z.string(),
    issues: z.array(ApiIssueSchema).optional(),
  })
  .strict()

type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>
type ApiIssue = z.infer<typeof ApiIssueSchema>
type ApiError = z.infer<typeof ApiErrorSchema>

export { API_ERROR_CODES, ApiErrorCodeSchema, ApiErrorSchema, ApiIssueSchema }
export type { ApiError, ApiErrorCode, ApiIssue }
