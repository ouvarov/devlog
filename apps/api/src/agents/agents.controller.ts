import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'

import {
  type AgentsInfo,
  type PrioritizeRequest,
  PrioritizeRequestSchema,
  type PrioritizeResponse,
} from '@devlog/shared'

import { AgentsService } from './agents.service.js'
import { PrioritizeAgent } from './prioritize/prioritize.agent.js'

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly prioritizeAgent: PrioritizeAgent,
  ) {}

  @Get()
  describe(): AgentsInfo {
    return this.agentsService.describe()
  }

  @Post('prioritize')
  @HttpCode(HttpStatus.OK)
  prioritize(
    @Body({ schema: PrioritizeRequestSchema }) _request: PrioritizeRequest,
  ): Promise<PrioritizeResponse> {
    return this.prioritizeAgent.run()
  }
}
