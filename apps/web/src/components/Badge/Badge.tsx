import type { FC, ReactNode } from 'react'

import type { Tone } from '@/types/tone'

import styles from './Badge.module.scss'

type BadgeProps = {
  tone: Tone
  children: ReactNode
}

const Badge: FC<BadgeProps> = ({ tone, children }) => (
  <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
)

export { Badge }
