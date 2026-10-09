interface ProgressBarProps {
  percentual: number
  legenda?: string
}

export function ProgressBar({ percentual, legenda }: ProgressBarProps) {
  const valor = Math.max(0, Math.min(100, percentual))
  return (
    <div className="my-2 flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${valor >= 100 ? 'bg-success' : 'bg-primary'}`}
          style={{ width: `${valor}%` }}
        />
      </div>
      {legenda && <span className="whitespace-nowrap text-xs text-text-muted">{legenda}</span>}
    </div>
  )
}
