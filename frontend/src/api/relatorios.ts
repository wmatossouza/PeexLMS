import { apiFetch } from './http'

export type SituacaoAluno = 'Ativo' | 'Parado' | 'Sem atividade'

export interface RelatorioCurso {
  id: number
  titulo: string
  nivel: string
  totalAulas: number
  alunosIniciaram: number
  alunosConcluiram: number
  percentualMedio: number
  quizRespondidos: number
  quizMediaAcerto: number | null
}

export interface RelatorioAluno {
  id: number
  nome: string
  email: string
  cursosIniciados: number
  cursosConcluidos: number
  aulasConcluidas: number
  percentualMedio: number
  ultimaAtividade: string | null
  situacao: SituacaoAluno
}

export interface AtividadeDia {
  data: string
  aulasConcluidas: number
}

export interface RelatorioResumo {
  totalAlunos: number
  alunosAtivos7Dias: number
  totalCursos: number
  totalTrilhas: number
  aulasConcluidas: number
  taxaConclusao: number
  quizMediaAcerto: number | null
  cursos: RelatorioCurso[]
  alunos: RelatorioAluno[]
  atividade: AtividadeDia[]
}

export function obterResumo() {
  return apiFetch<RelatorioResumo>('/api/relatorios/resumo')
}
