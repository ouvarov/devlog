import { BadRequestException } from '@nestjs/common'

import type { ApiIssue } from '@devlog/shared'

export class ValidationFailedException extends BadRequestException {
  constructor(readonly issues: ApiIssue[]) {
    super('Validation failed')
  }
}
