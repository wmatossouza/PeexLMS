import type { ReactNode } from 'react'

// Renderizador mínimo de texto de estudo (## título, - lista, ``` código, **negrito**).
// Monta elementos React — nunca HTML bruto — então o conteúdo não pode injetar script (AGENTS.md, regra 5).

function inline(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((trecho, i) => {
    if (trecho.startsWith('**') && trecho.endsWith('**') && trecho.length > 4)
      return <strong key={i}>{trecho.slice(2, -2)}</strong>
    if (trecho.startsWith('`') && trecho.endsWith('`') && trecho.length > 2)
      return (
        <code key={i} className="rounded bg-surface px-1.5 py-0.5 text-[0.9em] text-primary-ink">
          {trecho.slice(1, -1)}
        </code>
      )
    return trecho
  })
}

export function ConteudoTexto({ texto }: { texto: string }) {
  const linhas = texto.replace(/\r\n/g, '\n').split('\n')
  const blocos: ReactNode[] = []
  let i = 0

  while (i < linhas.length) {
    const linha = linhas[i]

    if (linha.trim() === '') {
      i++
    } else if (linha.startsWith('```')) {
      const codigo: string[] = []
      i++
      while (i < linhas.length && !linhas[i].startsWith('```')) codigo.push(linhas[i++])
      i++
      blocos.push(
        <pre key={blocos.length} className="overflow-x-auto rounded-lg border border-border bg-surface p-4 text-sm text-text">
          <code>{codigo.join('\n')}</code>
        </pre>,
      )
    } else if (linha.startsWith('## ')) {
      blocos.push(
        <h2 key={blocos.length} className="!mb-0 !mt-4">
          {linha.slice(3)}
        </h2>,
      )
      i++
    } else if (linha.startsWith('- ')) {
      const itens: string[] = []
      while (i < linhas.length && linhas[i].startsWith('- ')) itens.push(linhas[i++].slice(2))
      blocos.push(
        <ul key={blocos.length} className="list-disc space-y-1 pl-6">
          {itens.map((item, k) => (
            <li key={k}>{inline(item)}</li>
          ))}
        </ul>,
      )
    } else {
      const paragrafo: string[] = []
      while (i < linhas.length && linhas[i].trim() !== '' && !/^(## |- |```)/.test(linhas[i])) paragrafo.push(linhas[i++])
      blocos.push(<p key={blocos.length}>{inline(paragrafo.join(' '))}</p>)
    }
  }

  return <div className="flex flex-col gap-3 leading-7 text-text">{blocos}</div>
}
