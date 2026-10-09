import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obterCurso, type Curso } from '../api/cursos'
import { concluirAula, desmarcarAula } from '../api/progresso'
import { useAuth } from '../auth/AuthContext'
import { ehAluno } from '../auth/papeis'
import { ConteudoTexto } from '../components/ConteudoTexto'
import { PlayerVideo } from '../components/PlayerVideo'
import { useToast } from '../components/ToastProvider'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'

export function AulaPage() {
  const { id, aulaId } = useParams<{ id: string; aulaId: string }>()
  const navigate = useNavigate()
  const { notificar } = useToast()
  const { usuario } = useAuth()
  const aluno = ehAluno(usuario?.papeis)
  const [curso, setCurso] = useState<Curso | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    obterCurso(Number(id))
      .then(setCurso)
      .catch(() => setCurso(null))
      .finally(() => setCarregando(false))
  }, [id])

  if (carregando) return <p>Carregando aula...</p>

  const indice = curso?.aulas.findIndex((a) => a.id === Number(aulaId)) ?? -1
  if (!curso || indice < 0) return <p className="text-danger">Aula não encontrada.</p>

  const aula = curso.aulas[indice]
  const anterior = curso.aulas[indice - 1]
  const proxima = curso.aulas[indice + 1]
  const concluidas = curso.aulas.filter((a) => a.concluida).length

  function marcarLocal(alvoId: number, concluida: boolean) {
    setCurso((atual) => atual && { ...atual, aulas: atual.aulas.map((a) => (a.id === alvoId ? { ...a, concluida } : a)) })
  }

  async function concluirEAvancar() {
    if (salvando) return
    setSalvando(true)
    try {
      if (!aula.concluida) {
        await concluirAula(aula.id)
        marcarLocal(aula.id, true)
      }
      navigate(proxima ? `/cursos/${curso!.id}/aulas/${proxima.id}` : `/cursos/${curso!.id}`)
    } catch {
      notificar('Não foi possível concluir a aula. Tente novamente.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function desmarcar() {
    if (salvando) return
    setSalvando(true)
    try {
      await desmarcarAula(aula.id)
      marcarLocal(aula.id, false)
    } catch {
      notificar('Não foi possível desmarcar a aula. Tente novamente.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to={`/cursos/${curso.id}`} className="text-sm font-semibold text-text-muted hover:text-primary-ink">
        ← {curso.titulo}
      </Link>

      {!aluno && (
        <p className="rounded-lg border border-border bg-primary-soft px-4 py-2 text-sm text-text">
          Modo pré-visualização: é assim que o aluno vê esta aula. Seu perfil não registra progresso.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <article className="flex min-w-0 flex-col gap-4">
          {aula.tipoConteudo === 'Video' && <PlayerVideo url={aula.urlConteudo} titulo={aula.titulo} />}

          <header>
            <p className="text-sm text-text-muted">
              Aula {indice + 1} de {curso.aulas.length} · {aula.duracaoMinutos} min
            </p>
            <h1 className="!mt-1">{aula.titulo}</h1>
          </header>

          {aula.conteudo ? (
            <div className="rounded-xl border border-border bg-bg p-5">
              <ConteudoTexto texto={aula.conteudo} />
            </div>
          ) : (
            aula.tipoConteudo === 'Texto' && (
              <p className="rounded-xl border border-dashed border-border bg-bg p-5 text-text-muted">
                Esta aula ainda não tem texto de estudo.
              </p>
            )
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            {anterior ? (
              <Link to={`/cursos/${curso.id}/aulas/${anterior.id}`} className="text-sm font-semibold">
                ← Aula anterior
              </Link>
            ) : (
              <span />
            )}
            {aluno ? (
              <div className="flex items-center gap-3">
                {aula.concluida && (
                  <Button variant="secundario" onClick={desmarcar} disabled={salvando}>
                    Desmarcar conclusão
                  </Button>
                )}
                <Button onClick={concluirEAvancar} disabled={salvando}>
                  {salvando ? 'Salvando...' : proxima ? (aula.concluida ? 'Próxima aula' : 'Concluir e continuar') : aula.concluida ? 'Voltar ao curso' : 'Concluir aula'}
                  <Icon name="arrow" className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              proxima && (
                <Link to={`/cursos/${curso.id}/aulas/${proxima.id}`} className="text-sm font-semibold">
                  Próxima aula →
                </Link>
              )
            )}
          </div>
        </article>

        <aside className="h-fit rounded-xl border border-border bg-bg p-4 lg:sticky lg:top-6">
          <h2 className="!mt-0 text-base">Conteúdo do curso</h2>
          <p className="mb-3 text-xs text-text-muted">
            {concluidas} de {curso.aulas.length} aulas concluídas
          </p>
          <ol className="flex list-none flex-col gap-1 p-0">
            {curso.aulas.map((a, k) => (
              <li key={a.id}>
                <Link
                  to={`/cursos/${curso.id}/aulas/${a.id}`}
                  aria-current={a.id === aula.id ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    a.id === aula.id ? 'bg-primary-soft font-semibold text-primary-ink' : 'text-text hover:bg-surface'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      a.concluida ? 'bg-success text-white' : 'bg-surface text-text-muted'
                    }`}
                    aria-hidden="true"
                  >
                    {a.concluida ? <Icon name="check" className="h-3.5 w-3.5" /> : k + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.titulo}</span>
                  <Icon name={a.tipoConteudo === 'Video' ? 'play' : 'file'} className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  )
}
