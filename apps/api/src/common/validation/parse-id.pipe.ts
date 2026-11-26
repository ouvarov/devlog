import { ParseIntPipe } from '@nestjs/common'

import { ValidationFailedException } from './validation-failed.exception.js'

const createParseIdPipe = (): ParseIntPipe =>
  new ParseIntPipe({
    exceptionFactory: () =>
      new ValidationFailedException([{ path: ['id'], message: 'Expected an integer id' }]),
  })

export { createParseIdPipe }
