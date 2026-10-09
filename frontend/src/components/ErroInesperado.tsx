import { PaginaMensagem } from './PaginaMensagem'

// Fallback do ErrorBoundary. Não recebe o erro de propósito: nada técnico chega à tela.
export function ErroInesperado({ onTentarNovamente }: { onTentarNovamente: () => void }) {
  return (
    <PaginaMensagem
      titulo="Algo deu errado"
      texto="Não foi possível exibir esta página. Tente novamente em instantes."
      acao={
        <button
          type="button"
          onClick={onTentarNovamente}
          className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Tentar novamente
        </button>
      }
    />
  )
}
