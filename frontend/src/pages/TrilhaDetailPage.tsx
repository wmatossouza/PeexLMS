import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterTrilha, type Trilha } from '../api/trilhas'
import { useAuth } from '../auth/AuthContext'
import { ehAluno } from '../auth/papeis'
import { obterProgressoTrilha, type ProgressoTrilha } from '../api/progresso'
import { ProgressBar } from '../components/ProgressBar'
import { Badge } from '../components/ui/Badge'

export function TrilhaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const [trilha, setTrilha] = useState<Trilha | null>(null)
  const [progresso, setProgresso] = useState<ProgressoTrilha | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!id) return
    obterTrilha(Number(id)).then(setTrilha).finally(() => setCarregando(false))
    if (ehAluno(usuario?.papeis)) {
      obterProgressoTrilha(Number(id)).then(setProgresso).catch(() => setProgresso(null))
    }
  }, [id, usuario])

  if (carregando) return <p className="">Carregando...</p>
  if (!trilha) return <p className="py-3 text-danger">Trilha não encontrada.</p>

  function percentualDoCurso(cursoId: number) {
    return progresso?.cursos.find((c) => c.cursoId === cursoId)?.percentual ?? 0
  }

  return (
    <div className="">
      <Badge nivel={trilha.nivel} />
      <h1>{trilha.titulo}</h1>
      <p className="text-text-muted">{trilha.descricao}</p>

      {progresso && <ProgressBar percentual={progresso.percentual} legenda={`${progresso.percentual}% concluído`} />}

      <h2>Cursos</h2>
      {trilha.cursos.length === 0 ? (
        <p className="rounded-lg bg-surface p-8 text-center text-text-muted">Esta trilha ainda não tem cursos.</p>
      ) : (
        <ul className="list-none p-0">
          {trilha.cursos.map((curso) => (
            <li key={curso.id} className="border-b border-border py-3">
              <Link to={`/cursos/${curso.id}`} className="flex items-baseline justify-between text-text">
                <strong>{curso.titulo}</strong>
                <span className="text-xs text-text-muted">{curso.totalAulas} aula(s)</span>
              </Link>
              {ehAluno(usuario?.papeis) && <ProgressBar percentual={percentualDoCurso(curso.id)} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
