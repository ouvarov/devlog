import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'

import {
  type AgentsInfo,
  type DecomposeRequest,
  DecomposeRequestSchema,
  type DecomposeResponse,
  type PrioritizeRequest,
  PrioritizeRequestSchema,
  type PrioritizeResponse,
} from '@devlog/shared'

import { AgentsService } from './agents.service.js'
import { DecomposeAgent } from './decompose/decompose.agent.js'
import { PrioritizeAgent } from './prioritize/prioritize.agent.js'

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly prioritizeAgent: PrioritizeAgent,
    private readonly decomposeAgent: DecomposeAgent,
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

  @Post('decompose')
  @HttpCode(HttpStatus.OK)
  decompose(
    @Body({ schema: DecomposeRequestSchema }) request: DecomposeRequest,
  ): Promise<DecomposeResponse> {
    return this.decomposeAgent.run(request)
  }
}
