import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterCurso, type Curso } from '../api/cursos'
import { obterProgressoCurso, type ProgressoCurso } from '../api/progresso'
import { useAuth } from '../auth/AuthContext'
import { ehAluno } from '../auth/papeis'
import { ProgressBar } from '../components/ProgressBar'
import { QuizAluno } from '../components/QuizAluno'
import { Badge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'
import { CapaCurso } from '../components/CapaCurso'

export function CursoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const aluno = ehAluno(usuario?.papeis)
  const [curso, setCurso] = useState<Curso | null>(null)
  const [progresso, setProgresso] = useState<ProgressoCurso | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!id) return
    carregar(Number(id))
  }, [id])

  function carregar(cursoId: number) {
    const chamadas: Promise<unknown>[] = [obterCurso(cursoId).then(setCurso)]
    if (aluno) chamadas.push(obterProgressoCurso(cursoId).then(setProgresso))
    return Promise.all(chamadas).finally(() => setCarregando(false))
  }


  if (carregando) return <p>Carregando...</p>
  if (!curso) return <p className="text-danger">Curso não encontrado.</p>

  const proximaAula = curso.aulas.find((a) => !a.concluida) ?? curso.aulas[0]
  const duracaoTotal = curso.aulas.reduce((soma, a) => soma + a.duracaoMinutos, 0)

  return (
    <div className="flex flex-col gap-6">
      <Link to={aluno ? '/cursos' : '/admin/conteudo'} className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-primary-ink">
        {aluno ? '← Voltar aos cursos' : '← Voltar ao conteúdo'}
      </Link>

      <header className="overflow-hidden rounded-2xl border border-border bg-bg">
        <CapaCurso id={curso.id} className="h-36" />
        <div className="p-6">
        <Badge nivel={curso.nivel} />
        <h1 className="!mb-1">{curso.titulo}</h1>
        <p className="text-text-muted">{curso.descricao}</p>
        <p className="mt-3 flex items-center gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="play" className="h-4 w-4" />
            {curso.aulas.length} aula(s)
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="clock" className="h-4 w-4" />
            {duracaoTotal} min
          </span>
        </p>
        {progresso && (
          <div className="mt-4 border-t border-border pt-3">
            <ProgressBar
              percentual={progresso.percentual}
              legenda={
                progresso.temQuiz
                  ? `${progresso.aulasConcluidas} de ${progresso.totalAulas} aulas · quiz ${progresso.quizRespondido ? 'respondido' : 'pendente'}`
                  : `${progresso.aulasConcluidas} de ${progresso.totalAulas} aulas`
              }
            />
          </div>
        )}
        {proximaAula && (
          <Link
            to={`/cursos/${curso.id}/aulas/${proximaAula.id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Icon name="play" className="h-4 w-4" />
            {curso.aulas.some((a) => a.concluida) ? 'Continuar curso' : 'Começar curso'}
          </Link>
        )}
        </div>
      </header>

      <section>
        <h2 className="!mt-0">Conteúdo do curso</h2>
        <ol className="flex list-none flex-col gap-2 p-0">
          {curso.aulas.map((aula, indice) => (
            <li key={aula.id}>
              <Link
                to={`/cursos/${curso.id}/aulas/${aula.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3 text-text transition-colors hover:border-primary sm:p-4"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    aula.concluida ? 'bg-success text-white' : 'bg-primary-soft text-primary-ink'
                  }`}
                  aria-hidden="true"
                >
                  {aula.concluida ? <Icon name="check" className="h-4 w-4" /> : indice + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate">{aula.titulo}</strong>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                    <Icon name={aula.tipoConteudo === 'Video' ? 'play' : 'file'} className="h-3.5 w-3.5" />
                    {aula.tipoConteudo === 'Video' ? 'Vídeo' : 'Texto'} · {aula.duracaoMinutos} min
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary-ink">
                  {aula.concluida ? 'Revisar' : aula.tipoConteudo === 'Video' ? 'Assistir' : 'Ler'}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {aluno && <QuizAluno cursoId={curso.id} onRespondido={() => carregar(curso.id)} />}
    </div>
  )
}
