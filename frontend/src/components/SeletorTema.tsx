import { useEffect, useState } from 'react'
import { acompanharSistema, lerPreferencia, salvarPreferencia, type PreferenciaTema } from '../tema'
import { Icon, type IconName } from './ui/Icon'

const OPCOES: { valor: PreferenciaTema; rotulo: string; icone: IconName }[] = [
  { valor: 'claro', rotulo: 'Tema claro', icone: 'sun' },
  { valor: 'escuro', rotulo: 'Tema escuro', icone: 'moon' },
  { valor: 'sistema', rotulo: 'Seguir o sistema', icone: 'monitor' },
]

export function SeletorTema() {
  const [pref, setPref] = useState<PreferenciaTema>(lerPreferencia)

  useEffect(() => acompanharSistema(), [])

  function escolher(valor: PreferenciaTema) {
    setPref(valor)
    salvarPreferencia(valor)
  }

  return (
    <div role="radiogroup" aria-label="Tema da interface" className="flex items-center rounded-lg border border-border bg-surface p-0.5">
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={pref === o.valor}
          aria-label={o.rotulo}
          title={o.rotulo}
          onClick={() => escolher(o.valor)}
          className={`rounded-md p-1.5 transition-colors ${
            pref === o.valor ? 'bg-bg text-primary-ink shadow-sm' : 'text-text-muted hover:text-text'
          }`}
        >
          <Icon name={o.icone} className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
