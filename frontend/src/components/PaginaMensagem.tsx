import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PaginaMensagemProps {
  titulo: string
  texto: string
  acao?: ReactNode
}

// Mensagem genérica e segura: nunca recebe nem mostra detalhes técnicos do erro.
export function PaginaMensagem({ titulo, texto, acao }: PaginaMensagemProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="!my-0">{titulo}</h1>
      <p className="max-w-md text-text-muted">{texto}</p>
      {acao ?? (
        <Link
          to="/"
          className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Ir para o início
        </Link>
      )}
    </div>
  )
}
