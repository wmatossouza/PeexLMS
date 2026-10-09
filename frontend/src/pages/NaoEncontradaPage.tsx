import { PaginaMensagem } from '../components/PaginaMensagem'

export function NaoEncontradaPage() {
  return (
    <PaginaMensagem
      titulo="Página não encontrada"
      texto="O endereço pode estar incorreto ou a página não existe mais."
    />
  )
}
