import { useEffect, useState } from 'react'
import { listarTrilhas, type Trilha } from '../api/trilhas'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { CapaCurso } from '../components/CapaCurso'

export function TrilhasPage() {
  const [trilhas, setTrilhas] = useState<Trilha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    listarTrilhas()
      .then(setTrilhas)
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <p className="">Carregando trilhas...</p>
  if (erro) return <p className="py-3 text-danger">Não foi possível carregar as trilhas.</p>

  return (
    <div className="">
      <h1>Trilhas</h1>
      {trilhas.length === 0 ? (
        <div className="rounded-lg bg-surface p-8 text-center text-text-muted">
          <p>Nenhuma trilha cadastrada ainda.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {trilhas.map((trilha) => (
            <Card to={`/trilhas/${trilha.id}`} key={trilha.id} capa={<CapaCurso id={trilha.id + 100} icone="path" />}>
              <Badge nivel={trilha.nivel} />
              <h2 className="!mb-0 !mt-0 text-lg font-semibold">{trilha.titulo}</h2>
              <p className="text-sm text-text-muted">{trilha.descricao}</p>
              <span className="text-xs text-text-muted">{trilha.cursos.length} curso(s)</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
