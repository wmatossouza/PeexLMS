import { apiFetch } from './http'
import type { Nivel } from './trilhas'

export interface Aula {
  id: number
  cursoId: number
  titulo: string
  tipoConteudo: 'Video' | 'Texto'
  urlConteudo: string
  ordem: number
  duracaoMinutos: number
  concluida: boolean
  conteudo: string | null
}

export interface Curso {
  id: number
  titulo: string
  descricao: string
  nivel: Nivel
  criadoEm: string
  aulas: Aula[]
}

export interface CursoResumoCatalogo {
  id: number
  titulo: string
  descricao: string
  nivel: Nivel
  criadoEm: string
  totalAulas: number
}

export function listarCursos() {
  return apiFetch<CursoResumoCatalogo[]>('/api/cursos')
}

export function obterCurso(id: number) {
  return apiFetch<Curso>(`/api/cursos/${id}`)
}

export function criarCurso(dados: { titulo: string; descricao: string; nivel: Nivel }) {
  return apiFetch<Curso>('/api/cursos', { method: 'POST', body: JSON.stringify(dados) })
}

export function excluirCurso(id: number) {
  return apiFetch<void>(`/api/cursos/${id}`, { method: 'DELETE' })
}

export function criarAula(
  cursoId: number,
  dados: { titulo: string; tipoConteudo: 'Video' | 'Texto'; urlConteudo: string; ordem: number; duracaoMinutos: number; conteudo?: string },
) {
  return apiFetch<Aula>(`/api/cursos/${cursoId}/aulas`, { method: 'POST', body: JSON.stringify(dados) })
}
