import { Injectable } from '@nestjs/common'

import type { TaskDetail, TaskParent, TaskView } from '@devlog/shared'

import { toTaskView } from './task-view.mapper.js'
import { type OpenTasksFilter, TasksRepository } from './tasks.repository.js'

@Injectable()
export class TasksReader {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async listOpen(filter: OpenTasksFilter, limit: number): Promise<TaskView[]> {
    const tasks = await this.tasksRepository.findOpen(filter, limit)
    return tasks.map(toTaskView)
  }

  async searchByWords(words: string[], limit: number): Promise<TaskView[]> {
    const tasks = await this.tasksRepository.findMatchingAnyWord(words, limit)
    return tasks.map(toTaskView)
  }

  async findDetail(id: number): Promise<TaskDetail | null> {
    const task = await this.tasksRepository.findById(id)
    if (!task) return null

    const [subtasks, parent] = await Promise.all([
      this.tasksRepository.findSubtasks(id),
      this.findParent(task.parentId),
    ])
    return { ...toTaskView(task), subtasks: subtasks.map(toTaskView), parent }
  }

  private async findParent(parentId: number | null): Promise<TaskParent | null> {
    if (parentId === null) return null

    const parent = await this.tasksRepository.findById(parentId)
    return parent ? { id: parent.id, title: parent.title } : null
  }
}
