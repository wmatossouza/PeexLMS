import { useEffect, useState } from 'react'
import { obterResumo, type RelatorioAluno, type SituacaoAluno } from '../api/relatorios'
import { ProgressBar } from '../components/ProgressBar'
import { SituacaoBadge } from '../components/SituacaoBadge'
import { formatarData } from '../utils/data'
import { Icon } from '../components/ui/Icon'

const SITUACOES: ('Todos' | SituacaoAluno)[] = ['Todos', 'Ativo', 'Parado', 'Sem atividade']

export function AdminAlunosPage() {
  const [alunos, setAlunos] = useState<RelatorioAluno[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState<'Todos' | SituacaoAluno>('Todos')

  useEffect(() => {
    obterResumo()
      .then((r) => setAlunos(r.alunos))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  const termo = busca.trim().toLowerCase()
  const filtrados = alunos.filter(
    (a) =>
      (situacao === 'Todos' || a.situacao === situacao) &&
      (termo === '' || a.nome.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo)),
  )

  if (carregando) return <p>Carregando alunos...</p>
  if (erro) return <p className="text-danger">Não foi possível carregar os alunos.</p>

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="!mt-0">Alunos</h1>
        <p className="text-text-muted">Andamento de cada aluno nos cursos.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email"
            aria-label="Buscar alunos"
            className="!pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
          {SITUACOES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSituacao(s)}
              aria-pressed={situacao === s}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                situacao === s
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg text-text-muted hover:border-primary hover:text-primary-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg p-8 text-center text-text-muted">
          <p>{alunos.length === 0 ? 'Nenhum aluno cadastrado ainda.' : 'Nenhum aluno encontrado com esses filtros.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="border-b border-border px-4 py-3 font-semibold">Aluno</th>
                <th className="border-b border-border px-4 py-3 font-semibold">Progresso médio</th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">Cursos</th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">Aulas</th>
                <th className="border-b border-border px-4 py-3 font-semibold">Última atividade</th>
                <th className="border-b border-border px-4 py-3 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id}>
                  <td className="border-b border-border px-4 py-3">
                    <p className="font-semibold text-text">{a.nome}</p>
                    <p className="text-xs text-text-muted">{a.email}</p>
                  </td>
                  <td className="w-56 border-b border-border px-4 py-3">
                    <ProgressBar percentual={a.percentualMedio} legenda={`${Math.round(a.percentualMedio)}%`} />
                  </td>
                  <td className="border-b border-border px-4 py-3 text-right text-text">
                    {a.cursosConcluidos} de {a.cursosIniciados}
                    <span className="block text-xs text-text-muted">concluídos</span>
                  </td>
                  <td className="border-b border-border px-4 py-3 text-right text-text">{a.aulasConcluidas}</td>
                  <td className="border-b border-border px-4 py-3 text-text">{formatarData(a.ultimaAtividade)}</td>
                  <td className="border-b border-border px-4 py-3">
                    <SituacaoBadge situacao={a.situacao} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
