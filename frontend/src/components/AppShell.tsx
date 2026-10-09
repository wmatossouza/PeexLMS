import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ehGestor } from '../auth/papeis'
import { Icon, type IconName } from './ui/Icon'
import { SeletorTema } from './SeletorTema'

interface ItemMenu {
  to: string
  rotulo: string
  icone: IconName
  fim?: boolean
}

const MENU_ALUNO: ItemMenu[] = [
  { to: '/inicio', rotulo: 'Início', icone: 'home' },
  { to: '/cursos', rotulo: 'Cursos', icone: 'book' },
  { to: '/meus-cursos', rotulo: 'Meus cursos', icone: 'play' },
  { to: '/trilhas', rotulo: 'Trilhas', icone: 'path' },
]

const MENU_GESTOR: ItemMenu[] = [
  { to: '/admin', rotulo: 'Painel', icone: 'home', fim: true },
  { to: '/admin/alunos', rotulo: 'Alunos', icone: 'users' },
  { to: '/admin/conteudo', rotulo: 'Conteúdo', icone: 'book' },
]

function classeItem({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-primary-soft text-primary-ink' : 'text-text-muted hover:bg-surface hover:text-text'
  }`
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function AppShell() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const gestor = ehGestor(usuario?.papeis)
  const itens = gestor ? MENU_GESTOR : MENU_ALUNO


  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-text">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">P</span>
            <span className="hidden text-base font-bold tracking-tight sm:inline">Peex Learning</span>
          </Link>

          <nav aria-label="Principal" className="hidden flex-1 items-center gap-1 md:flex">
            {itens.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.fim} className={classeItem}>
                <Icon name={item.icone} className="h-4 w-4" />
                {item.rotulo}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <SeletorTema />
            {usuario && (
              <div className="hidden items-center gap-2.5 sm:flex">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-ink"
                  aria-hidden="true"
                >
                  {iniciais(usuario.nome)}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-text">{usuario.nome}</p>
                  <p className="text-xs text-text-muted">{usuario.papeis[0] ?? 'Aluno'}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-danger"
            >
              <Icon name="logout" />
            </button>
            <button
              type="button"
              onClick={() => setMenuAberto((aberto) => !aberto)}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              className="rounded-lg p-2 text-text hover:bg-surface md:hidden"
            >
              <Icon name={menuAberto ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {menuAberto && (
          <nav aria-label="Principal (celular)" className="border-t border-border bg-bg px-4 py-2 md:hidden">
            <ul className="flex list-none flex-col gap-1 p-0">
              {itens.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.fim} className={classeItem} onClick={() => setMenuAberto(false)}>
                    <Icon name={item.icone} className="h-4 w-4" />
                    {item.rotulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
