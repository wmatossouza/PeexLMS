import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterMeusCursos, type MeuCurso } from '../api/progresso'
import { useAuth } from '../auth/AuthContext'
import { ProgressBar } from '../components/ProgressBar'
import { Badge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'

function Indicador({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-3xl font-bold tracking-tight text-text">{valor}</p>
      <p className="text-sm text-text-muted">{rotulo}</p>
    </div>
  )
}

export function HomePage() {
  const { usuario } = useAuth()
  const [cursos, setCursos] = useState<MeuCurso[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    obterMeusCursos()
      .then(setCursos)
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  const emAndamento = cursos.filter((c) => c.percentual < 100)
  const concluidos = cursos.filter((c) => c.percentual >= 100).length
  const aulasConcluidas = cursos.reduce((soma, c) => soma + c.aulasConcluidas, 0)
  const continuar = emAndamento[0]
  const primeiroNome = usuario?.nome.split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="!mt-0">Olá, {primeiroNome} 👋</h1>
        <p className="text-text-muted">Pronto para continuar aprendendo?</p>
      </div>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="text-danger">Não foi possível carregar seu progresso.</p>}

      {!carregando && !erro && (
        <>
          {continuar ? (
            <section className="flex flex-col gap-3 rounded-2xl bg-linear-to-br from-primary to-capa-1-para p-6 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white/80">Continue de onde parou</p>
                <p className="mt-1 text-xl font-bold tracking-tight">{continuar.titulo}</p>
                <p className="mt-1 text-sm text-white/80">
                  {continuar.aulasConcluidas} de {continuar.totalAulas} aulas · {Math.round(continuar.percentual)}% concluído
                </p>
              </div>
              <Link
                to={`/cursos/${continuar.cursoId}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-bg px-4 py-2.5 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90"
              >
                <Icon name="play" className="h-4 w-4" />
                Continuar
              </Link>
            </section>
          ) : (
            <section className="rounded-2xl bg-primary-soft p-6">
              <p className="text-lg font-semibold text-text">Você ainda não tem cursos em andamento.</p>
              <p className="mb-3 text-text-muted">Escolha um curso no catálogo para começar.</p>
              <Link to="/cursos" className="inline-flex items-center gap-2 font-semibold">
                Explorar cursos <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </section>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Indicador valor={emAndamento.length} rotulo="Cursos em andamento" />
            <Indicador valor={concluidos} rotulo="Cursos concluídos" />
            <Indicador valor={aulasConcluidas} rotulo="Aulas concluídas" />
          </div>

          {cursos.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="!m-0">Meus cursos</h2>
                <Link to="/meus-cursos" className="text-sm font-semibold">
                  Ver todos
                </Link>
              </div>
              <ul className="flex list-none flex-col gap-3 p-0">
                {cursos.slice(0, 3).map((curso) => (
                  <li key={curso.cursoId}>
                    <Link
                      to={`/cursos/${curso.cursoId}`}
                      className="flex flex-col gap-1 rounded-xl border border-border bg-bg p-4 text-text transition-colors hover:border-primary"
                    >
                      <span className="flex items-center gap-2">
                        <Badge nivel={curso.nivel} />
                        <strong>{curso.titulo}</strong>
                      </span>
                      <ProgressBar percentual={curso.percentual} legenda={`${curso.aulasConcluidas} de ${curso.totalAulas} aulas`} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
