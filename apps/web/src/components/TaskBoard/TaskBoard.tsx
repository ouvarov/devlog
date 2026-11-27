'use client'

import type { FC } from 'react'

import { AddTaskButton } from '@/components/AddTaskButton/AddTaskButton'
import { TaskFilters } from '@/components/TaskFilters/TaskFilters'
import { TaskList } from '@/components/TaskList/TaskList'
import { useTaskListFilters } from '@/hooks/useTaskListFilters'

import styles from './TaskBoard.module.scss'

const TaskBoard: FC = () => {
  const { filters, setFilters } = useTaskListFilters()

  return (
    <section className={styles.board}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Backlog</h1>
        <AddTaskButton />
      </div>
      <TaskFilters filters={filters} onChange={setFilters} />
      <TaskList filters={filters} />
    </section>
  )
}

export { TaskBoard }
