import { type FC, Suspense } from 'react'

import { PrioritizePanel } from '@/components/PrioritizePanel/PrioritizePanel'
import { ProviderBadge } from '@/components/ProviderBadge/ProviderBadge'
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
      <ProviderBadge />
      <PrioritizePanel />
    </aside>
  </div>
)

export default HomePage
