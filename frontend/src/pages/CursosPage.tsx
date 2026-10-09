import { useEffect, useState } from 'react'
import { listarCursos, type CursoResumoCatalogo } from '../api/cursos'
import type { Nivel } from '../api/trilhas'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { CapaCurso } from '../components/CapaCurso'
import { Icon } from '../components/ui/Icon'

const NIVEIS: ('Todos' | Nivel)[] = ['Todos', 'Iniciante', 'Intermediario', 'Avancado']

export function CursosPage() {
  const [cursos, setCursos] = useState<CursoResumoCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<'Todos' | Nivel>('Todos')

  useEffect(() => {
    listarCursos()
      .then(setCursos)
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  const termo = busca.trim().toLowerCase()
  const filtrados = cursos.filter(
    (c) =>
      (nivel === 'Todos' || c.nivel === nivel) &&
      (termo === '' || c.titulo.toLowerCase().includes(termo) || c.descricao.toLowerCase().includes(termo)),
  )

  if (carregando) return <p>Carregando cursos...</p>
  if (erro) return <p className="text-danger">Não foi possível carregar os cursos.</p>

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="!mt-0">Cursos</h1>
        <p className="text-text-muted">Explore o catálogo e escolha o próximo passo.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cursos"
            aria-label="Buscar cursos"
            className="!pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por nível">
          {NIVEIS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNivel(n)}
              aria-pressed={nivel === n}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                nivel === n
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg text-text-muted hover:border-primary hover:text-primary-ink'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg p-8 text-center text-text-muted">
          <p>{cursos.length === 0 ? 'Nenhum curso cadastrado ainda.' : 'Nenhum curso encontrado com esses filtros.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {filtrados.map((curso) => (
            <Card to={`/cursos/${curso.id}`} key={curso.id} capa={<CapaCurso id={curso.id} />}>
              <Badge nivel={curso.nivel} />
              <h2 className="!mb-0 !mt-0 text-lg font-semibold">{curso.titulo}</h2>
              <p className="line-clamp-2 text-sm text-text-muted">{curso.descricao}</p>
              <span className="mt-auto flex items-center gap-1.5 text-xs text-text-muted">
                <Icon name="play" className="h-3.5 w-3.5" />
                {curso.totalAulas} aula(s)
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
