import { notFound } from 'next/navigation'
import type { FC } from 'react'

import { TaskIdSchema } from '@devlog/shared'

import { TaskDetails } from '@/components/TaskDetails/TaskDetails'

import styles from './page.module.scss'

const TaskPage: FC<PageProps<'/tasks/[id]'>> = async ({ params }) => {
  const { id } = await params
  const taskId = TaskIdSchema.safeParse(Number(id))
  if (!taskId.success) notFound()

  return (
    <main className={styles.page}>
      <TaskDetails taskId={taskId.data} />
    </main>
  )
}

export default TaskPage
