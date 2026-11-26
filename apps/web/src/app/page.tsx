import type { FC } from 'react'

import { ApiStatus } from '@/components/ApiStatus/ApiStatus'

import styles from './page.module.scss'

const HomePage: FC = () => (
  <main className={styles.page}>
    <h1 className={styles.title}>DevLog</h1>
    <ApiStatus />
  </main>
)

export default HomePage
