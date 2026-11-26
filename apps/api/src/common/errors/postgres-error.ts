import { HttpStatus } from '@nestjs/common'
import { DrizzleQueryError } from 'drizzle-orm'

import type { ApiErrorCode } from '@devlog/shared'

type PostgresErrorMapping = {
  statusCode: HttpStatus
  code: ApiErrorCode
  message: string
}

const POSTGRES_ERROR_MAPPINGS: Readonly<Record<string, PostgresErrorMapping>> = {
  '23503': {
    statusCode: HttpStatus.NOT_FOUND,
    code: 'NOT_FOUND',
    message: 'Referenced task not found',
  },
  '23514': {
    statusCode: HttpStatus.BAD_REQUEST,
    code: 'VALIDATION_FAILED',
    message: 'Value violates a constraint',
  },
  '22P02': {
    statusCode: HttpStatus.BAD_REQUEST,
    code: 'VALIDATION_FAILED',
    message: 'Invalid value',
  },
  '22003': {
    statusCode: HttpStatus.BAD_REQUEST,
    code: 'VALIDATION_FAILED',
    message: 'Value out of range',
  },
}

const postgresErrorCodeOf = (error: unknown): string | null => {
  const databaseError = error instanceof DrizzleQueryError ? error.cause : error
  if (typeof databaseError !== 'object' || databaseError === null) return null
  if (!('code' in databaseError) || typeof databaseError.code !== 'string') return null

  return databaseError.code
}

const mapPostgresError = (error: unknown): PostgresErrorMapping | null => {
  const postgresErrorCode = postgresErrorCodeOf(error)
  if (postgresErrorCode === null) return null

  return POSTGRES_ERROR_MAPPINGS[postgresErrorCode] ?? null
}

export { mapPostgresError }
