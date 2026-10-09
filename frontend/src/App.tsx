import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './auth/AuthContext'
import { ehGestor } from './auth/papeis'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { CursosPage } from './pages/CursosPage'
import { MeusCursosPage } from './pages/MeusCursosPage'
import { TrilhasPage } from './pages/TrilhasPage'
import { TrilhaDetailPage } from './pages/TrilhaDetailPage'
import { CursoDetailPage } from './pages/CursoDetailPage'
import { AulaPage } from './pages/AulaPage'
import { AdminPage } from './pages/AdminPage'
import { AdminPainelPage } from './pages/AdminPainelPage'
import { AdminAlunosPage } from './pages/AdminAlunosPage'
import { NaoEncontradaPage } from './pages/NaoEncontradaPage'
import { ErroInesperado } from './components/ErroInesperado'

function Raiz() {
  const { usuario, carregando } = useAuth()
  if (carregando) return <p className="p-6">Carregando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={ehGestor(usuario.papeis) ? '/admin' : '/inicio'} replace />
}

function AreaLogada() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  )
}

// Telas de estudo: admin/instrutor não estudam, então vão para o painel de gestão.
function SoAluno({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  if (ehGestor(usuario?.papeis)) return <Navigate to="/admin" replace />
  return <>{children}</>
}

function SoGestor({ children }: { children: ReactNode }) {
  return <ProtectedRoute papeis={['Admin', 'Instrutor']}>{children}</ProtectedRoute>
}

function App() {
  const { pathname } = useLocation()

  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => <ErroInesperado onTentarNovamente={resetErrorBoundary} />}
      resetKeys={[pathname]}
      onError={() => console.error('Erro inesperado na interface.')}
    >
      <Routes>
        <Route path="/" element={<Raiz />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrar" element={<RegisterPage />} />
  
        <Route element={<AreaLogada />}>
          <Route path="/inicio" element={<SoAluno><HomePage /></SoAluno>} />
          <Route path="/cursos" element={<SoAluno><CursosPage /></SoAluno>} />
          <Route path="/meus-cursos" element={<SoAluno><MeusCursosPage /></SoAluno>} />
          <Route path="/trilhas" element={<SoAluno><TrilhasPage /></SoAluno>} />
  
          {/* Detalhe de curso/aula/trilha: o aluno estuda; o gestor só pré-visualiza. */}
          <Route path="/cursos/:id" element={<CursoDetailPage />} />
          <Route path="/cursos/:id/aulas/:aulaId" element={<AulaPage />} />
          <Route path="/trilhas/:id" element={<TrilhaDetailPage />} />
  
          <Route path="/admin" element={<SoGestor><AdminPainelPage /></SoGestor>} />
          <Route path="/admin/alunos" element={<SoGestor><AdminAlunosPage /></SoGestor>} />
          <Route path="/admin/conteudo" element={<SoGestor><AdminPage /></SoGestor>} />
  
          <Route path="*" element={<NaoEncontradaPage />} />
        </Route>
  
      </Routes>
    </ErrorBoundary>
  )
}

export default App
