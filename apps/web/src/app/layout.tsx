import type { Metadata } from 'next'
import type { FC, ReactNode } from 'react'

import '@/styles/global.scss'

const metadata: Metadata = {
  title: 'DevLog',
  description: 'Task tracker for an engineering team with in-product AI agents',
}

type RootLayoutProps = {
  children: ReactNode
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
)

export { metadata }
export default RootLayout
