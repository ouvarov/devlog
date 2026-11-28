import { Module } from '@nestjs/common'

import { LlmModule } from '../llm/llm.module.js'
import { TasksModule } from '../tasks/tasks.module.js'
import { AgentsController } from './agents.controller.js'
import { AgentsService } from './agents.service.js'
import { DecomposeAgent } from './decompose/decompose.agent.js'
import { PrioritizeAgent } from './prioritize/prioritize.agent.js'

@Module({
  imports: [LlmModule, TasksModule],
  controllers: [AgentsController],
  providers: [AgentsService, PrioritizeAgent, DecomposeAgent],
})
export class AgentsModule {}
