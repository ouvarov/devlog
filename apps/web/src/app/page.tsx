import { type FC, Suspense } from 'react'

import { TaskBoard } from '@/components/TaskBoard/TaskBoard'

import styles from './page.module.scss'

const HomePage: FC = () => (
  <div className={styles.page}>
    <main className={styles.main}>
      <Suspense fallback={<p className={styles.note}>Loading tasks…</p>}>
        <TaskBoard />
      </Suspense>
    </main>
    <aside className={styles.agents} aria-labelledby="agents-heading">
      <h2 id="agents-heading" className={styles.agentsTitle}>
        Agents
      </h2>
      <p className={styles.note}>Agent panels will appear here.</p>
    </aside>
  </div>
)

export default HomePage
