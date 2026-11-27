import type { Metadata } from 'next'
import Link from 'next/link'
import type { FC, ReactNode } from 'react'

import { ApiStatus } from '@/components/ApiStatus/ApiStatus'
import { QueryProvider } from '@/components/QueryProvider/QueryProvider'
import '@/styles/global.scss'

import styles from './layout.module.scss'

const metadata: Metadata = {
  title: 'DevLog',
  description: 'Task tracker for an engineering team with in-product AI agents',
}

type RootLayoutProps = {
  children: ReactNode
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => (
  <html lang="en">
    <body>
      <QueryProvider>
        <div className={styles.shell}>
          <header className={styles.header}>
            <Link href="/" className={styles.brand}>
              DevLog
            </Link>
            <ApiStatus />
          </header>
          {children}
        </div>
      </QueryProvider>
    </body>
  </html>
)

export { metadata }
export default RootLayout
