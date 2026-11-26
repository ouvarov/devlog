import { type ArgumentsHost, Logger, NotFoundException } from '@nestjs/common'
import type { HttpAdapterHost } from '@nestjs/core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ApiError } from '@devlog/shared'

import { ValidationFailedException } from '../validation/validation-failed.exception.js'
import { ApiExceptionFilter } from './api-exception.filter.js'

type Reply = { body: ApiError; statusCode: number }

const RESPONSE = { name: 'response' }

const hostWithResponse = (): ArgumentsHost =>
  ({ switchToHttp: () => ({ getResponse: () => RESPONSE }) }) as unknown as ArgumentsHost

const catchWithFilter = (exception: unknown): Reply => {
  const replies: Reply[] = []
  const httpAdapterHost = {
    httpAdapter: {
      reply: (_response: unknown, body: ApiError, statusCode: number) => {
        replies.push({ body, statusCode })
      },
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

  it('hides an unknown error behind 500 INTERNAL and logs it', () => {
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    const reply = catchWithFilter(new Error('connection lost'))

    expect(reply).toEqual({
      statusCode: 500,
      body: { statusCode: 500, code: 'INTERNAL', message: 'Internal server error' },
    })
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('connection lost'))
  })
})
