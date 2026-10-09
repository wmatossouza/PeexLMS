import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primario' | 'secundario' | 'perigo' | 'link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60'

const VARIANTES: Record<ButtonVariant, string> = {
  primario: 'bg-primary text-white shadow-sm hover:bg-primary-hover active:translate-y-px',
  secundario: 'border border-border bg-bg text-text hover:border-primary hover:text-primary-ink',
  perigo: 'border border-border bg-bg text-danger hover:border-danger hover:bg-danger-soft',
  link: 'bg-transparent p-0 font-medium text-primary-ink hover:underline',
}

export function Button({ variant = 'primario', className = '', ...props }: ButtonProps) {
  return <button className={`${BASE} ${VARIANTES[variant]} ${className}`} {...props} />
}
