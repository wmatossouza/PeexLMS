import { Link } from 'react-router-dom'
import { useEffect, useState, type FormEvent } from 'react'
import { criarTrilha, associarCurso, excluirTrilha, listarTrilhas, type Nivel, type Trilha } from '../api/trilhas'
import { criarCurso, criarAula, excluirCurso, listarCursos, type CursoResumoCatalogo } from '../api/cursos'
import { criarQuiz } from '../api/quiz'
import { obterProgressoAlunos, type ProgressoAluno } from '../api/progresso'
import { ApiError } from '../api/http'
import { useToast } from '../components/ToastProvider'
import { Button } from '../components/ui/Button'

const NIVEIS: Nivel[] = ['Iniciante', 'Intermediario', 'Avancado']

interface OpcaoForm {
  texto: string
  correta: boolean
}

interface PerguntaForm {
  enunciado: string
  opcoes: OpcaoForm[]
}

function novaOpcao(): OpcaoForm {
  return { texto: '', correta: false }
}

function novaPergunta(): PerguntaForm {
  return { enunciado: '', opcoes: [novaOpcao(), novaOpcao()] }
}

function mensagemDeErro(err: unknown): string {
  return err instanceof ApiError && err.message ? err.message : 'Não foi possível concluir a ação. Tente novamente.'
}

export function AdminPage() {
  const { notificar } = useToast()
  const [trilhas, setTrilhas] = useState<Trilha[]>([])
  const [cursos, setCursos] = useState<CursoResumoCatalogo[]>([])

  const [enviandoTrilha, setEnviandoTrilha] = useState(false)
  const [enviandoCurso, setEnviandoCurso] = useState(false)
  const [enviandoAula, setEnviandoAula] = useState(false)
  const [enviandoAssociar, setEnviandoAssociar] = useState(false)
  const [enviandoQuiz, setEnviandoQuiz] = useState(false)
  const [enviandoProgresso, setEnviandoProgresso] = useState(false)

  const [erroQuiz, setErroQuiz] = useState<string | null>(null)
  const [quizCursoId, setQuizCursoId] = useState('')
  const [quizTitulo, setQuizTitulo] = useState('')
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([novaPergunta()])

  const [progressoCursoId, setProgressoCursoId] = useState('')
  const [progressoAlunos, setProgressoAlunos] = useState<ProgressoAluno[] | null>(null)

  const [excluindoTrilhaId, setExcluindoTrilhaId] = useState<number | null>(null)
  const [excluindoCursoId, setExcluindoCursoId] = useState<number | null>(null)

  function recarregar() {
    listarTrilhas().then(setTrilhas)
    listarCursos().then(setCursos)
  }

  useEffect(recarregar, [])

  async function onCriarTrilha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviandoTrilha) return
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    setEnviandoTrilha(true)
    try {
      await criarTrilha({
        titulo: String(form.get('titulo')),
        descricao: String(form.get('descricao')),
        nivel: String(form.get('nivel')) as Nivel,
        categoria: String(form.get('categoria')),
      })
      formEl.reset()
      notificar('Trilha criada.')
      recarregar()
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setEnviandoTrilha(false)
    }
  }

  async function onCriarCurso(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviandoCurso) return
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    setEnviandoCurso(true)
    try {
      await criarCurso({
        titulo: String(form.get('titulo')),
        descricao: String(form.get('descricao')),
        nivel: String(form.get('nivel')) as Nivel,
      })
      formEl.reset()
      notificar('Curso criado.')
      recarregar()
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setEnviandoCurso(false)
    }
  }

  async function onCriarAula(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviandoAula) return
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const cursoId = Number(form.get('cursoId'))
    setEnviandoAula(true)
    try {
      await criarAula(cursoId, {
        titulo: String(form.get('titulo')),
        tipoConteudo: String(form.get('tipoConteudo')) as 'Video' | 'Texto',
        urlConteudo: String(form.get('urlConteudo')),
        ordem: Number(form.get('ordem')),
        duracaoMinutos: Number(form.get('duracaoMinutos')),
        conteudo: String(form.get('conteudo') ?? '') || undefined,
      })
      formEl.reset()
      notificar('Aula criada.')
      recarregar()
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setEnviandoAula(false)
    }
  }

  async function onAssociar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviandoAssociar) return
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    setEnviandoAssociar(true)
    try {
      await associarCurso(Number(form.get('trilhaId')), Number(form.get('cursoId')), Number(form.get('ordem')))
      formEl.reset()
      notificar('Curso associado à trilha.')
      recarregar()
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setEnviandoAssociar(false)
    }
  }

  async function onExcluirTrilha(trilha: Trilha) {
    if (excluindoTrilhaId !== null) return
    if (!window.confirm(`Excluir a trilha "${trilha.titulo}"? Isso não exclui os cursos associados.`)) return

    setExcluindoTrilhaId(trilha.id)
    try {
      await excluirTrilha(trilha.id)
      notificar('Trilha excluída.')
      recarregar()
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setExcluindoTrilhaId(null)
    }
  }

  async function onExcluirCurso(curso: CursoResumoCatalogo) {
    if (excluindoCursoId !== null) return
    if (!window.confirm(`Excluir o curso "${curso.titulo}"? Isso também exclui suas aulas e seu quiz.`)) return

    setExcluindoCursoId(curso.id)
    try {
      await excluirCurso(curso.id)
      notificar('Curso excluído.')
      recarregar()
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setExcluindoCursoId(null)
    }
  }

  function atualizarEnunciado(perguntaIndex: number, valor: string) {
    setPerguntas((atual) =>
      atual.map((p, i) => (i === perguntaIndex ? { ...p, enunciado: valor } : p)),
    )
  }

  function atualizarTextoOpcao(perguntaIndex: number, opcaoIndex: number, valor: string) {
    setPerguntas((atual) =>
      atual.map((p, i) =>
        i === perguntaIndex
          ? { ...p, opcoes: p.opcoes.map((o, j) => (j === opcaoIndex ? { ...o, texto: valor } : o)) }
          : p,
      ),
    )
  }

  function marcarCorreta(perguntaIndex: number, opcaoIndex: number) {
    setPerguntas((atual) =>
      atual.map((p, i) =>
        i === perguntaIndex
          ? { ...p, opcoes: p.opcoes.map((o, j) => ({ ...o, correta: j === opcaoIndex })) }
          : p,
      ),
    )
  }

  function adicionarPergunta() {
    setPerguntas((atual) => [...atual, novaPergunta()])
  }

  function removerPergunta(perguntaIndex: number) {
    setPerguntas((atual) => atual.filter((_, i) => i !== perguntaIndex))
  }

  function adicionarOpcao(perguntaIndex: number) {
    setPerguntas((atual) =>
      atual.map((p, i) => (i === perguntaIndex ? { ...p, opcoes: [...p.opcoes, novaOpcao()] } : p)),
    )
  }

  function removerOpcao(perguntaIndex: number, opcaoIndex: number) {
    setPerguntas((atual) =>
      atual.map((p, i) => (i === perguntaIndex ? { ...p, opcoes: p.opcoes.filter((_, j) => j !== opcaoIndex) } : p)),
    )
  }

  async function onCriarQuiz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviandoQuiz) return
    setErroQuiz(null)

    if (!quizCursoId) {
      setErroQuiz('Selecione um curso.')
      return
    }
    for (const pergunta of perguntas) {
      if (pergunta.opcoes.filter((o) => o.correta).length !== 1) {
        setErroQuiz('Cada pergunta precisa de exatamente uma opção marcada como correta.')
        return
      }
    }

    setEnviandoQuiz(true)
    try {
      await criarQuiz(Number(quizCursoId), {
        titulo: quizTitulo,
        perguntas: perguntas.map((p, i) => ({ enunciado: p.enunciado, ordem: i + 1, opcoes: p.opcoes })),
      })
      setQuizCursoId('')
      setQuizTitulo('')
      setPerguntas([novaPergunta()])
      notificar('Quiz criado.')
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setEnviandoQuiz(false)
    }
  }

  async function onVerProgresso(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviandoProgresso || !progressoCursoId) return
    setEnviandoProgresso(true)
    try {
      const lista = await obterProgressoAlunos(Number(progressoCursoId))
      setProgressoAlunos(lista)
    } catch (err) {
      notificar(mensagemDeErro(err), 'erro')
    } finally {
      setEnviandoProgresso(false)
    }
  }

  return (
    <div className="">
      <h1>Conteúdo</h1>

      <section className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="!mt-0">Nova trilha</h2>
        <form onSubmit={onCriarTrilha} className="flex flex-wrap items-center gap-3">
          <input name="titulo" placeholder="Título" required minLength={3} disabled={enviandoTrilha} className="min-w-36 flex-1" />
          <input name="descricao" placeholder="Descrição" required disabled={enviandoTrilha} className="min-w-36 flex-1" />
          <input name="categoria" placeholder="Categoria (ex: Frontend)" required disabled={enviandoTrilha} className="min-w-36 flex-1" />
          <select name="nivel" defaultValue="Iniciante" disabled={enviandoTrilha} className="min-w-36 flex-1">
            {NIVEIS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={enviandoTrilha}>
            {enviandoTrilha ? 'Criando...' : 'Criar trilha'}
          </Button>
        </form>

        {trilhas.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {trilhas.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg px-3 py-2.5">
                <span className="text-text">
                  {t.titulo} <span className="text-xs text-text-muted">{t.categoria} · {t.cursos.length} curso(s)</span>
                </span>
                <Button
                  type="button"
                  variant="perigo"
                  onClick={() => onExcluirTrilha(t)}
                  disabled={excluindoTrilhaId !== null}
                >
                  {excluindoTrilhaId === t.id ? 'Excluindo...' : 'Excluir'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="!mt-0">Novo curso</h2>
        <form onSubmit={onCriarCurso} className="flex flex-wrap items-center gap-3">
          <input name="titulo" placeholder="Título" required minLength={3} disabled={enviandoCurso} className="min-w-36 flex-1" />
          <input name="descricao" placeholder="Descrição" required disabled={enviandoCurso} className="min-w-36 flex-1" />
          <select name="nivel" defaultValue="Iniciante" disabled={enviandoCurso} className="min-w-36 flex-1">
            {NIVEIS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={enviandoCurso}>
            {enviandoCurso ? 'Criando...' : 'Criar curso'}
          </Button>
        </form>

        {cursos.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {cursos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg px-3 py-2.5">
                <span className="text-text">
                  {c.titulo} <span className="text-xs text-text-muted">{c.totalAulas} aula(s)</span>
                </span>
                <Link to={`/cursos/${c.id}`} className="ml-auto text-sm font-semibold">
                  Pré-visualizar
                </Link>
                <Button
                  type="button"
                  variant="perigo"
                  onClick={() => onExcluirCurso(c)}
                  disabled={excluindoCursoId !== null}
                >
                  {excluindoCursoId === c.id ? 'Excluindo...' : 'Excluir'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="!mt-0">Nova aula</h2>
        <form onSubmit={onCriarAula} className="flex flex-wrap items-center gap-3">
          <select name="cursoId" required disabled={enviandoAula} className="min-w-36 flex-1">
            <option value="">Selecione o curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          <input name="titulo" placeholder="Título da aula" required minLength={3} disabled={enviandoAula} className="min-w-36 flex-1" />
          <select name="tipoConteudo" defaultValue="Video" disabled={enviandoAula} className="min-w-36 flex-1">
            <option value="Video">Vídeo</option>
            <option value="Texto">Texto</option>
          </select>
          <input name="urlConteudo" placeholder="URL do conteúdo" required disabled={enviandoAula} className="min-w-36 flex-1" />
          <input name="ordem" type="number" placeholder="Ordem" defaultValue={1} required disabled={enviandoAula} className="min-w-36 flex-1" />
          <input
            name="duracaoMinutos"
            type="number"
            placeholder="Duração (min)"
            defaultValue={10}
            required
            disabled={enviandoAula}
            className="min-w-36 flex-1"
          />
          <textarea
            name="conteudo"
            placeholder="Texto de estudo (opcional) — use ## para títulos, - para listas e ``` para código"
            rows={4}
            disabled={enviandoAula}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted disabled:opacity-60"
          />
          <Button type="submit" disabled={enviandoAula}>
            {enviandoAula ? 'Criando...' : 'Criar aula'}
          </Button>
        </form>
      </section>

      <section className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="!mt-0">Associar curso a trilha</h2>
        <form onSubmit={onAssociar} className="flex flex-wrap items-center gap-3">
          <select name="trilhaId" required disabled={enviandoAssociar} className="min-w-36 flex-1">
            <option value="">Selecione a trilha</option>
            {trilhas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </select>
          <select name="cursoId" required disabled={enviandoAssociar} className="min-w-36 flex-1">
            <option value="">Selecione o curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          <input name="ordem" type="number" placeholder="Ordem" defaultValue={1} required disabled={enviandoAssociar} className="min-w-36 flex-1" />
          <Button type="submit" disabled={enviandoAssociar}>
            {enviandoAssociar ? 'Associando...' : 'Associar'}
          </Button>
        </form>
      </section>

      <section className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="!mt-0">Novo quiz</h2>
        <form onSubmit={onCriarQuiz} className="flex max-w-xl flex-col gap-3">
          <select
            value={quizCursoId}
            onChange={(e) => setQuizCursoId(e.target.value)}
            required
            disabled={enviandoQuiz}
          >
            <option value="">Selecione o curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          <input
            placeholder="Título do quiz"
            value={quizTitulo}
            onChange={(e) => setQuizTitulo(e.target.value)}
            required
            minLength={3}
            disabled={enviandoQuiz}
          />

          {perguntas.map((pergunta, perguntaIndex) => (
            <fieldset
              key={perguntaIndex}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 disabled:opacity-60"
              disabled={enviandoQuiz}
            >
              <legend className="px-1 text-sm font-semibold text-text">Pergunta {perguntaIndex + 1}</legend>
              <input
                placeholder="Enunciado da pergunta"
                value={pergunta.enunciado}
                onChange={(e) => atualizarEnunciado(perguntaIndex, e.target.value)}
                required
                minLength={3}
              />

              {pergunta.opcoes.map((opcao, opcaoIndex) => (
                <div key={opcaoIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correta-${perguntaIndex}`}
                    checked={opcao.correta}
                    onChange={() => marcarCorreta(perguntaIndex, opcaoIndex)}
                    aria-label={`Marcar opção ${opcaoIndex + 1} como correta`}
                  />
                  <input
                    placeholder={`Opção ${opcaoIndex + 1}`}
                    value={opcao.texto}
                    onChange={(e) => atualizarTextoOpcao(perguntaIndex, opcaoIndex, e.target.value)}
                    required
                    className="flex-1"
                  />
                  {pergunta.opcoes.length > 2 && (
                    <Button type="button" variant="secundario" onClick={() => removerOpcao(perguntaIndex, opcaoIndex)}>
                      Remover opção
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="secundario" onClick={() => adicionarOpcao(perguntaIndex)} className="self-start">
                + Opção
              </Button>

              {perguntas.length > 1 && (
                <Button type="button" variant="secundario" onClick={() => removerPergunta(perguntaIndex)} className="self-start">
                  Remover pergunta
                </Button>
              )}
            </fieldset>
          ))}

          <Button type="button" variant="secundario" onClick={adicionarPergunta} disabled={enviandoQuiz} className="self-start">
            + Pergunta
          </Button>

          {erroQuiz && <p className="text-danger">{erroQuiz}</p>}
          <Button type="submit" disabled={enviandoQuiz} className="self-start">
            {enviandoQuiz ? 'Criando...' : 'Criar quiz'}
          </Button>
        </form>
      </section>

      <section className="mb-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="!mt-0">Progresso dos alunos</h2>
        <form onSubmit={onVerProgresso} className="flex flex-wrap items-center gap-3">
          <select
            value={progressoCursoId}
            onChange={(e) => setProgressoCursoId(e.target.value)}
            required
            disabled={enviandoProgresso}
            className="min-w-36 flex-1"
          >
            <option value="">Selecione o curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={enviandoProgresso}>
            {enviandoProgresso ? 'Carregando...' : 'Ver progresso'}
          </Button>
        </form>

        {progressoAlunos && (
          progressoAlunos.length === 0 ? (
            <p className="mt-3 text-text-muted">Nenhum aluno cadastrado ainda.</p>
          ) : (
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-3 py-2 text-left font-semibold text-text-muted">Aluno</th>
                  <th className="border-b border-border px-3 py-2 text-left font-semibold text-text-muted">Aulas</th>
                  <th className="border-b border-border px-3 py-2 text-left font-semibold text-text-muted">Quiz</th>
                  <th className="border-b border-border px-3 py-2 text-left font-semibold text-text-muted">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {progressoAlunos.map((aluno) => (
                  <tr key={aluno.usuarioId}>
                    <td className="border-b border-border px-3 py-2">
                      {aluno.nome}
                      <span className="text-xs text-text-muted"> {aluno.email}</span>
                    </td>
                    <td className="border-b border-border px-3 py-2">{aluno.aulasConcluidas} de {aluno.totalAulas}</td>
                    <td className="border-b border-border px-3 py-2">
                      {aluno.quizRespondido ? `${aluno.quizAcertos} de ${aluno.quizTotal}` : 'pendente'}
                    </td>
                    <td className="border-b border-border px-3 py-2">{aluno.percentual}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </section>
    </div>
  )
}
