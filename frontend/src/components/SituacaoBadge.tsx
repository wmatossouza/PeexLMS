import type { SituacaoAluno } from '../api/relatorios'

// Estado nunca só por cor: sempre ponto + texto.
const ESTILOS: Record<SituacaoAluno, { ponto: string; texto: string }> = {
  Ativo: { ponto: 'bg-success', texto: 'text-text' },
  Parado: { ponto: 'bg-warning', texto: 'text-text' },
  'Sem atividade': { ponto: 'bg-danger', texto: 'text-text' },
}

export function SituacaoBadge({ situacao }: { situacao: SituacaoAluno }) {
  const estilo = ESTILOS[situacao]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${estilo.texto}`}>
      <span className={`h-2 w-2 rounded-full ${estilo.ponto}`} aria-hidden="true" />
      {situacao}
    </span>
  )
}

