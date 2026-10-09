import { useEffect, useState } from 'react'
import { obterQuizParaResponder, responderQuiz, type QuizParaResponder, type ResultadoQuiz } from '../api/quiz'
import { Button } from './ui/Button'
import { useToast } from './ToastProvider'

interface QuizAlunoProps {
  cursoId: number
  onRespondido?: () => void
}

export function QuizAluno({ cursoId, onRespondido }: QuizAlunoProps) {
  const { notificar } = useToast()
  const [quiz, setQuiz] = useState<QuizParaResponder | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [respostas, setRespostas] = useState<Record<number, number>>({})
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    obterQuizParaResponder(cursoId)
      .then((q) => {
        setQuiz(q)
        setResultado(q?.ultimoResultado ?? null)
      })
      .finally(() => setCarregando(false))
  }, [cursoId])

  if (carregando) return null
  if (!quiz) return null

  function escolher(perguntaId: number, opcaoId: number) {
    setRespostas((atual) => ({ ...atual, [perguntaId]: opcaoId }))
  }

  async function enviar() {
    if (!quiz || enviando) return
    if (Object.keys(respostas).length !== quiz.perguntas.length) {
      setErro('Responda todas as perguntas antes de enviar.')
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      const payload = Object.entries(respostas).map(([perguntaId, opcaoId]) => ({
        quizPerguntaId: Number(perguntaId),
        quizOpcaoId: opcaoId,
      }))
      const resultadoResposta = await responderQuiz(quiz.id, payload)
      setResultado(resultadoResposta)
      notificar('Quiz respondido.')
      onRespondido?.()
    } catch {
      notificar('Não foi possível enviar suas respostas. Tente novamente.', 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-5">
      <h2 className="!mt-0">{quiz.titulo}</h2>

      {resultado && (
        <p className="mb-3 font-semibold text-primary-ink">
          Resultado: {resultado.acertos} de {resultado.total} acertos.
        </p>
      )}

      {quiz.perguntas.map((pergunta) => (
        <fieldset key={pergunta.id} className="mb-4 border-0 p-0">
          <legend className="mb-2 p-0 font-semibold text-text">{pergunta.enunciado}</legend>
          {pergunta.opcoes.map((opcao) => (
            <label key={opcao.id} className="flex items-center gap-2 py-1 text-text">
              <input
                type="radio"
                name={`pergunta-${pergunta.id}`}
                checked={respostas[pergunta.id] === opcao.id}
                onChange={() => escolher(pergunta.id, opcao.id)}
              />
              {opcao.texto}
            </label>
          ))}
        </fieldset>
      ))}

      {erro && <p className="mb-3 text-danger">{erro}</p>}

      <Button onClick={enviar} disabled={enviando}>
        {resultado ? 'Responder novamente' : 'Enviar respostas'}
      </Button>
    </section>
  )
}
