import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

import type { ApiError, ApiErrorCode } from '@devlog/shared'

import { ValidationFailedException } from '../validation/validation-failed.exception.js'
import { mapPostgresError } from './postgres-error.js'

const API_ERROR_CODES_BY_STATUS: Readonly<Partial<Record<number, ApiErrorCode>>> = {
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
}

const INTERNAL_ERROR: ApiError = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL',
  message: 'Internal server error',
}

const codeForStatus = (statusCode: HttpStatus): ApiErrorCode => {
  if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) return 'INTERNAL'
  return API_ERROR_CODES_BY_STATUS[statusCode] ?? 'BAD_REQUEST'
}

const messageOf = (exception: HttpException): string => {
  const response = exception.getResponse()
  if (typeof response === 'string') return response
  if (!('message' in response)) return exception.message
  if (Array.isArray(response.message)) return response.message.join('; ')

  return typeof response.message === 'string' ? response.message : exception.message
}

const fromHttpException = (exception: HttpException): ApiError => {
  const statusCode = exception.getStatus()
  const message = messageOf(exception)
  if (exception instanceof ValidationFailedException) {
    return { statusCode, code: 'VALIDATION_FAILED', message, issues: exception.issues }
  }

  return { statusCode, code: codeForStatus(statusCode), message }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const apiError = this.toApiError(exception)
    const { httpAdapter } = this.httpAdapterHost

    httpAdapter.reply(host.switchToHttp().getResponse(), apiError, apiError.statusCode)
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof HttpException) return fromHttpException(exception)

    const postgresError = mapPostgresError(exception)
    if (postgresError) return postgresError

    this.logger.error(exception instanceof Error ? exception.stack : String(exception))
    return INTERNAL_ERROR
  }
}
