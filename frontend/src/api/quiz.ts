import { apiFetch, ApiError } from './http'

export interface QuizOpcaoAdmin {
  id: number
  texto: string
  correta: boolean
}

export interface QuizPerguntaAdmin {
  id: number
  enunciado: string
  ordem: number
  opcoes: QuizOpcaoAdmin[]
}

export interface QuizAdmin {
  id: number
  cursoId: number
  titulo: string
  perguntas: QuizPerguntaAdmin[]
}

export interface QuizOpcaoAluno {
  id: number
  texto: string
}

export interface QuizPerguntaAluno {
  id: number
  enunciado: string
  ordem: number
  opcoes: QuizOpcaoAluno[]
}

export interface ResultadoQuiz {
  quizId: number
  acertos: number
  total: number
  respondidoEm: string
}

export interface QuizParaResponder {
  id: number
  cursoId: number
  titulo: string
  perguntas: QuizPerguntaAluno[]
  ultimoResultado: ResultadoQuiz | null
}

export interface QuizPerguntaRequest {
  enunciado: string
  ordem: number
  opcoes: { texto: string; correta: boolean }[]
}

export async function obterQuizAdmin(cursoId: number): Promise<QuizAdmin | null> {
  try {
    return await apiFetch<QuizAdmin>(`/api/cursos/${cursoId}/quiz`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export function criarQuiz(cursoId: number, dados: { titulo: string; perguntas: QuizPerguntaRequest[] }) {
  return apiFetch<QuizAdmin>(`/api/cursos/${cursoId}/quiz`, { method: 'POST', body: JSON.stringify(dados) })
}

export async function obterQuizParaResponder(cursoId: number): Promise<QuizParaResponder | null> {
  try {
    return await apiFetch<QuizParaResponder>(`/api/cursos/${cursoId}/quiz/responder`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export function responderQuiz(quizId: number, respostas: { quizPerguntaId: number; quizOpcaoId: number }[]) {
  return apiFetch<ResultadoQuiz>(`/api/quiz/${quizId}/responder`, { method: 'POST', body: JSON.stringify({ respostas }) })
}
