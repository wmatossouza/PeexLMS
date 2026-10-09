import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Card({ to, capa, children }: { to: string; capa?: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg text-text transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
    >
      {capa}
      <div className="flex flex-1 flex-col gap-2 p-4">{children}</div>
    </Link>
  )
}
