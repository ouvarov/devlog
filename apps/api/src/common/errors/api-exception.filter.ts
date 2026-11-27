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
import { LlmNotConfiguredException } from './llm-not-configured.exception.js'
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
  if (exception instanceof LlmNotConfiguredException) {
    return { statusCode, code: 'LLM_NOT_CONFIGURED', message }
  }

  return { statusCode, code: codeForStatus(statusCode), message }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp()
    const apiError = this.toApiError(exception, httpContext.getRequest())

    this.httpAdapterHost.httpAdapter.reply(httpContext.getResponse(), apiError, apiError.statusCode)
  }

  private toApiError(exception: unknown, request: unknown): ApiError {
    if (exception instanceof HttpException) return fromHttpException(exception)

    const postgresError = mapPostgresError(exception)
    if (postgresError) return postgresError

    this.logUnexpectedError(exception, request)
    return INTERNAL_ERROR
  }

  private logUnexpectedError(exception: unknown, request: unknown): void {
    const { httpAdapter } = this.httpAdapterHost
    const method = String(httpAdapter.getRequestMethod(request))
    const url = String(httpAdapter.getRequestUrl(request))
    const stack = exception instanceof Error ? exception.stack : String(exception)

    this.logger.error(`${method} ${url} failed`, stack)
  }
}
