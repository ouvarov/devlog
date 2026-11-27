import type { ComponentProps, FC } from 'react'

import styles from './Button.module.scss'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
}

const Button: FC<ButtonProps> = ({ variant = 'secondary', className, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
  />
)

export { Button }
export type { ButtonVariant }
