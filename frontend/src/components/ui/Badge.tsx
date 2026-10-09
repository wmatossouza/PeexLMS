import type { Nivel } from '../../api/trilhas'

const CLASSES: Record<Nivel, string> = {
  Iniciante: 'bg-badge-iniciante-bg text-badge-iniciante-text',
  Intermediario: 'bg-badge-intermediario-bg text-badge-intermediario-text',
  Avancado: 'bg-badge-avancado-bg text-badge-avancado-text',
}

export function Badge({ nivel }: { nivel: Nivel }) {
  return (
    <span className={`inline-block self-start rounded-full px-3 py-0.5 text-xs font-semibold ${CLASSES[nivel]}`}>
      {nivel}
    </span>
  )
}
