import { apiFetch } from './http'
import type { Nivel } from './trilhas'

export interface ProgressoCurso {
  cursoId: number
  totalAulas: number
  aulasConcluidas: number
  temQuiz: boolean
  quizRespondido: boolean
  quizAcertos: number | null
  quizTotal: number | null
  percentual: number
}

export interface ProgressoTrilha {
  trilhaId: number
  percentual: number
  cursos: { cursoId: number; percentual: number }[]
}

export interface ProgressoAluno {
  usuarioId: number
  nome: string
  email: string
  aulasConcluidas: number
  totalAulas: number
  quizRespondido: boolean
  quizAcertos: number | null
  quizTotal: number | null
  percentual: number
}

export interface MeuCurso {
  cursoId: number
  titulo: string
  nivel: Nivel
  totalAulas: number
  aulasConcluidas: number
  temQuiz: boolean
  quizRespondido: boolean
  quizAcertos: number | null
  quizTotal: number | null
  percentual: number
}

export function obterProgressoTrilha(trilhaId: number) {
  return apiFetch<ProgressoTrilha>(`/api/progresso/trilhas/${trilhaId}`)
}

export function concluirAula(aulaId: number) {
  return apiFetch<void>(`/api/progresso/aulas/${aulaId}/concluir`, { method: 'POST' })
}

export function desmarcarAula(aulaId: number) {
  return apiFetch<void>(`/api/progresso/aulas/${aulaId}/concluir`, { method: 'DELETE' })
}

export function obterProgressoCurso(cursoId: number) {
  return apiFetch<ProgressoCurso>(`/api/progresso/cursos/${cursoId}`)
}

export function obterProgressoAlunos(cursoId: number) {
  return apiFetch<ProgressoAluno[]>(`/api/progresso/cursos/${cursoId}/alunos`)
}

export function obterMeusCursos() {
  return apiFetch<MeuCurso[]>('/api/progresso/meus-cursos')
}
