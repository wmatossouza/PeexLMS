import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obterMeusCursos, type MeuCurso } from '../api/progresso'
import { ProgressBar } from '../components/ProgressBar'
import { Badge } from '../components/ui/Badge'

export function MeusCursosPage() {
  const [cursos, setCursos] = useState<MeuCurso[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    obterMeusCursos()
      .then(setCursos)
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <p className="">Carregando...</p>
  if (erro) return <p className="py-3 text-danger">Não foi possível carregar seus cursos.</p>

  return (
    <div className="">
      <h1>Meus cursos</h1>
      {cursos.length === 0 ? (
        <div className="rounded-lg bg-surface p-8 text-center text-text-muted">
          <p>Você ainda não começou nenhum curso.</p>
          <Link to="/cursos">Ver catálogo de cursos</Link>
        </div>
      ) : (
        <ul className="list-none p-0">
          {cursos.map((curso) => (
            <li key={curso.cursoId} className="mb-3 rounded-xl border border-border bg-bg p-4">
              <Link to={`/cursos/${curso.cursoId}`} className="flex items-center gap-2 text-text">
                <Badge nivel={curso.nivel} />
                <strong>{curso.titulo}</strong>
              </Link>
              <ProgressBar
                percentual={curso.percentual}
                legenda={
                  curso.temQuiz
                    ? `${curso.aulasConcluidas} de ${curso.totalAulas} aulas · quiz ${curso.quizRespondido ? 'respondido' : 'pendente'}`
                    : `${curso.aulasConcluidas} de ${curso.totalAulas} aulas`
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
