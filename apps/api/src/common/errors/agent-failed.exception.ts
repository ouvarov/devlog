import { UnprocessableEntityException } from '@nestjs/common'

import type { AgentTraceStep } from '@devlog/shared'

export class AgentFailedException extends UnprocessableEntityException {
  constructor(
    message: string,
    readonly trace: AgentTraceStep[],
  ) {
    super(message)
  }
}
