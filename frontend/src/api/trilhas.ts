import { apiFetch } from './http'

export type Nivel = 'Iniciante' | 'Intermediario' | 'Avancado'

export interface CursoResumo {
  id: number
  titulo: string
  nivel: Nivel
  ordem: number
  totalAulas: number
}

export interface Trilha {
  id: number
  titulo: string
  descricao: string
  nivel: Nivel
  categoria: string
  criadoEm: string
  cursos: CursoResumo[]
}

export function listarTrilhas(categoria?: string) {
  const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : ''
  return apiFetch<Trilha[]>(`/api/trilhas${query}`)
}

export function obterTrilha(id: number) {
  return apiFetch<Trilha>(`/api/trilhas/${id}`)
}

export function criarTrilha(dados: { titulo: string; descricao: string; nivel: Nivel; categoria: string }) {
  return apiFetch<Trilha>('/api/trilhas', { method: 'POST', body: JSON.stringify(dados) })
}

export function associarCurso(trilhaId: number, cursoId: number, ordem: number) {
  return apiFetch<void>(`/api/trilhas/${trilhaId}/cursos`, {
    method: 'POST',
    body: JSON.stringify({ cursoId, ordem }),
  })
}

export function excluirTrilha(id: number) {
  return apiFetch<void>(`/api/trilhas/${id}`, { method: 'DELETE' })
}
