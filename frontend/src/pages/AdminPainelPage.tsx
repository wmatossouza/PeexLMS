import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterResumo, type RelatorioResumo } from '../api/relatorios'
import { SituacaoBadge } from '../components/SituacaoBadge'
import { formatarData } from '../utils/data'

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-sm text-text-muted">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-text">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-text-muted">{detalhe}</p>}
    </div>
  )
}

function Painel({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-bg p-5">
      <h2 className="!mb-0 !mt-0 text-base">{titulo}</h2>
      {subtitulo && <p className="mb-4 text-xs text-text-muted">{subtitulo}</p>}
      {!subtitulo && <div className="mb-4" />}
      {children}
    </section>
  )
}

// Barras horizontais, uma cor (sequencial), valor na ponta, trilho recessivo.
function ConclusaoPorCurso({ cursos }: { cursos: RelatorioResumo['cursos'] }) {
  const ordenados = [...cursos].filter((c) => c.alunosIniciaram > 0).sort((a, b) => b.percentualMedio - a.percentualMedio)
  if (ordenados.length === 0) return <p className="text-sm text-text-muted">Nenhum aluno iniciou um curso ainda.</p>

  return (
    <ul className="flex list-none flex-col gap-3 p-0">
      {ordenados.map((c) => (
        <li
          key={c.id}
          title={`${c.titulo}: ${c.percentualMedio}% de progresso médio · ${c.alunosIniciaram} iniciaram · ${c.alunosConcluiram} concluíram`}
        >
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-text">{c.titulo}</span>
            <span className="shrink-0 font-semibold text-text">{Math.round(c.percentualMedio)}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={Math.round(c.percentualMedio)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso médio em ${c.titulo}`}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${c.percentualMedio}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// Colunas (<= 24px), cantos de 4px na ponta, base reta, uma cor.
function AtividadeRecente({ atividade }: { atividade: RelatorioResumo['atividade'] }) {
  const max = Math.max(1, ...atividade.map((d) => d.aulasConcluidas))
  const total = atividade.reduce((soma, d) => soma + d.aulasConcluidas, 0)
  if (total === 0) return <p className="text-sm text-text-muted">Nenhuma aula concluída nos últimos 14 dias.</p>

  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 border-b border-border" role="img" aria-label={`${total} aulas concluídas nos últimos 14 dias`}>
        {atividade.map((d) => {
          const dia = new Date(`${d.data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          return (
            <div key={d.data} className="group relative flex h-full flex-1 items-end justify-center" title={`${dia}: ${d.aulasConcluidas} aula(s)`}>
              {d.aulasConcluidas > 0 && (
                <span className="absolute -top-1 hidden text-xs font-semibold text-text group-hover:block">{d.aulasConcluidas}</span>
              )}
              <div
                className="w-full max-w-6 rounded-t bg-primary transition-opacity group-hover:opacity-80"
                style={{ height: `${(d.aulasConcluidas / max) * 100}%`, minHeight: d.aulasConcluidas > 0 ? 4 : 0 }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-text-muted">
        <span>{new Date(`${atividade[0].data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
        <span>hoje</span>
      </div>
    </div>
  )
}

export function AdminPainelPage() {
  const [resumo, setResumo] = useState<RelatorioResumo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    obterResumo()
      .then(setResumo)
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <p>Carregando painel...</p>
  if (erro || !resumo) return <p className="text-danger">Não foi possível carregar o painel.</p>

  const atencao = resumo.alunos.filter((a) => a.situacao !== 'Ativo')
  const concluidosTotal = resumo.cursos.reduce((soma, c) => soma + c.alunosConcluiram, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="!mt-0">Painel</h1>
          <p className="text-text-muted">Acompanhe o andamento dos alunos e a saúde do conteúdo.</p>
        </div>
        <Link
          to="/admin/conteudo"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Gerenciar cursos e trilhas
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Indicador rotulo="Alunos" valor={String(resumo.totalAlunos)} />
        <Indicador
          rotulo="Ativos na semana"
          valor={String(resumo.alunosAtivos7Dias)}
          detalhe={resumo.totalAlunos ? `${Math.round((resumo.alunosAtivos7Dias * 100) / resumo.totalAlunos)}% dos alunos` : undefined}
        />
        <Indicador rotulo="Cursos / trilhas" valor={`${resumo.totalCursos} / ${resumo.totalTrilhas}`} />
        <Indicador rotulo="Conclusão dos cursos" valor={`${Math.round(resumo.taxaConclusao)}%`} detalhe={`${concluidosTotal} conclusões`} />
        <Indicador
          rotulo="Média nos quizzes"
          valor={resumo.quizMediaAcerto === null ? '—' : `${Math.round(resumo.quizMediaAcerto)}%`}
          detalhe={`${resumo.aulasConcluidas} aulas concluídas`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Progresso médio por curso" subtitulo="Entre os alunos que já começaram cada curso">
          <ConclusaoPorCurso cursos={resumo.cursos} />
        </Painel>
        <Painel titulo="Aulas concluídas por dia" subtitulo="Últimos 14 dias">
          <AtividadeRecente atividade={resumo.atividade} />
        </Painel>
      </div>

      <Painel
        titulo="Alunos que precisam de atenção"
        subtitulo="Sem atividade há mais de 7 dias, ou que ainda não começaram"
      >
        {atencao.length === 0 ? (
          <p className="text-sm text-text-muted">Todos os alunos estão ativos. 🎉</p>
        ) : (
          <ul className="flex list-none flex-col divide-y divide-border p-0">
            {atencao.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{a.nome}</p>
                  <p className="truncate text-xs text-text-muted">{a.email}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-xs text-text-muted">Última atividade: {formatarData(a.ultimaAtividade)}</span>
                  <SituacaoBadge situacao={a.situacao} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link to="/admin/alunos" className="mt-3 inline-block text-sm font-semibold">
          Ver todos os alunos
        </Link>
      </Painel>

      <Painel titulo="Resumo por curso" subtitulo="Os mesmos dados do gráfico, em tabela">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="border-b border-border px-3 py-2 font-semibold">Curso</th>
                <th className="border-b border-border px-3 py-2 text-right font-semibold">Aulas</th>
                <th className="border-b border-border px-3 py-2 text-right font-semibold">Iniciaram</th>
                <th className="border-b border-border px-3 py-2 text-right font-semibold">Concluíram</th>
                <th className="border-b border-border px-3 py-2 text-right font-semibold">Progresso médio</th>
                <th className="border-b border-border px-3 py-2 text-right font-semibold">Média no quiz</th>
              </tr>
            </thead>
            <tbody>
              {resumo.cursos.map((c) => (
                <tr key={c.id}>
                  <td className="border-b border-border px-3 py-2 text-text">
                    <Link to={`/cursos/${c.id}`}>{c.titulo}</Link>
                  </td>
                  <td className="border-b border-border px-3 py-2 text-right">{c.totalAulas}</td>
                  <td className="border-b border-border px-3 py-2 text-right">{c.alunosIniciaram}</td>
                  <td className="border-b border-border px-3 py-2 text-right">{c.alunosConcluiram}</td>
                  <td className="border-b border-border px-3 py-2 text-right">{Math.round(c.percentualMedio)}%</td>
                  <td className="border-b border-border px-3 py-2 text-right">
                    {c.quizMediaAcerto === null ? '—' : `${Math.round(c.quizMediaAcerto)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </div>
  )
}
