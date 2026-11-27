import {
  type ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common'
import type { HttpAdapterHost } from '@nestjs/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ApiError } from '@devlog/shared'

import { ValidationFailedException } from '../validation/validation-failed.exception.js'
import { ApiExceptionFilter } from './api-exception.filter.js'

type Reply = { body: ApiError; statusCode: number }

type FakeRequest = { method: string; originalUrl: string }

const RESPONSE = { name: 'response' }
const REQUEST: FakeRequest = { method: 'POST', originalUrl: '/tasks/batch' }

const hostWithResponse = (): ArgumentsHost =>
  ({
    switchToHttp: () => ({ getResponse: () => RESPONSE, getRequest: () => REQUEST }),
  }) as unknown as ArgumentsHost

const catchWithFilter = (exception: unknown): Reply => {
  const replies: Reply[] = []
  const httpAdapterHost = {
    httpAdapter: {
      reply: (_response: unknown, body: ApiError, statusCode: number) => {
        replies.push({ body, statusCode })
      },
      getRequestMethod: (request: FakeRequest) => request.method,
      getRequestUrl: (request: FakeRequest) => request.originalUrl,
    },
  } as unknown as HttpAdapterHost

  new ApiExceptionFilter(httpAdapterHost).catch(exception, hostWithResponse())

  const [reply] = replies
  if (!reply) throw new Error('The filter did not reply')
  return reply
}

describe('ApiExceptionFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('replies with the status and message of an HTTP exception', () => {
    const reply = catchWithFilter(new NotFoundException('Task 7 not found'))

    expect(reply).toEqual({
      statusCode: 404,
      body: { statusCode: 404, code: 'NOT_FOUND', message: 'Task 7 not found' },
    })
  })

  it('passes validation issues through', () => {
    const issues = [{ path: ['title'], message: 'Too small' }]

    const reply = catchWithFilter(new ValidationFailedException(issues))

    expect(reply.body).toEqual({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      issues,
    })
  })

  it('marks a 4xx that is not a validation failure as BAD_REQUEST', () => {
    const reply = catchWithFilter(new PayloadTooLargeException())

    expect(reply).toEqual({
      statusCode: 413,
      body: { statusCode: 413, code: 'BAD_REQUEST', message: 'Payload Too Large' },
    })
  })

  it('marks a plain 400 as BAD_REQUEST, not VALIDATION_FAILED', () => {
    const reply = catchWithFilter(new BadRequestException('Task 3 is done'))

    expect(reply.body.code).toBe('BAD_REQUEST')
  })

  it('hides an unknown error behind 500 INTERNAL and logs it', () => {
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    const reply = catchWithFilter(new Error('connection lost'))

    expect(reply).toEqual({
      statusCode: 500,
      body: { statusCode: 500, code: 'INTERNAL', message: 'Internal server error' },
    })
    expect(logError).toHaveBeenCalledWith(
      'POST /tasks/batch failed',
      expect.stringContaining('connection lost'),
    )
  })
})
