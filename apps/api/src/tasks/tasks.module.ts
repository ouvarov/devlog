import { Module } from '@nestjs/common'

import { TasksController } from './tasks.controller.js'
import { TasksReader } from './tasks.reader.js'
import { TasksRepository } from './tasks.repository.js'
import { TasksService } from './tasks.service.js'

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksReader, TasksRepository],
  exports: [TasksService, TasksReader],
})
export class TasksModule {}
