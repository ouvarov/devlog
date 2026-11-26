import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'

import {
  type BatchTasks,
  type BatchTasksResult,
  BatchTasksSchema,
  type CreateTask,
  CreateTaskSchema,
  type ListTasksQuery,
  ListTasksQuerySchema,
  type TaskDetail,
  type TaskListResponse,
  type TaskView,
  type UpdateTask,
  UpdateTaskSchema,
} from '@devlog/shared'

import { TasksService } from './tasks.service.js'

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@Query({ schema: ListTasksQuerySchema }) query: ListTasksQuery): Promise<TaskListResponse> {
    return this.tasksService.list(query)
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  batch(@Body({ schema: BatchTasksSchema }) batch: BatchTasks): Promise<BatchTasksResult> {
    return this.tasksService.batch(batch)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TaskDetail> {
    return this.tasksService.findOne(id)
  }

  @Post()
  create(@Body({ schema: CreateTaskSchema }) input: CreateTask): Promise<TaskView> {
    return this.tasksService.create(input)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body({ schema: UpdateTaskSchema }) changes: UpdateTask,
  ): Promise<TaskView> {
    return this.tasksService.update(id, changes)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tasksService.remove(id)
  }
}
