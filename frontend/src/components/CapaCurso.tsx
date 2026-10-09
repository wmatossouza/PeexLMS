import { Icon, type IconName } from './ui/Icon'

// Classes completas (o Tailwind precisa enxergá-las literalmente); cores vêm dos tokens --color-capa-*.
const GRADIENTES = [
  'from-capa-1-de to-capa-1-para',
  'from-capa-2-de to-capa-2-para',
  'from-capa-3-de to-capa-3-para',
  'from-capa-4-de to-capa-4-para',
  'from-capa-5-de to-capa-5-para',
  'from-capa-6-de to-capa-6-para',
]

function Padrao({ variante }: { variante: number }) {
  const props = { fill: 'currentColor', className: 'text-white/15' }
  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {variante === 0 && (
        <>
          <circle cx="170" cy="20" r="55" {...props} />
          <circle cx="20" cy="95" r="40" {...props} />
        </>
      )}
      {variante === 1 && (
        <>
          <rect x="120" y="-20" width="90" height="90" rx="18" transform="rotate(20 165 25)" {...props} />
          <rect x="-20" y="55" width="70" height="70" rx="14" transform="rotate(-15 15 90)" {...props} />
        </>
      )}
      {variante === 2 && (
        <>
          <path d="M0 80 Q 50 40 100 70 T 200 50 V100 H0Z" {...props} />
          <circle cx="160" cy="25" r="22" {...props} />
        </>
      )}
    </svg>
  )
}

interface CapaCursoProps {
  id: number
  icone?: IconName
  className?: string
}

// Capa fictícia e determinística: o mesmo curso/trilha sempre recebe o mesmo visual.
export function CapaCurso({ id, icone = 'book', className = 'h-28' }: CapaCursoProps) {
  const gradiente = GRADIENTES[Math.abs(id) % GRADIENTES.length]
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br ${gradiente} text-white ${className}`}
      aria-hidden="true"
    >
      <Padrao variante={Math.abs(id) % 3} />
      <Icon name={icone} className="relative h-10 w-10 drop-shadow" />
    </div>
  )
}
