import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute({ children, papeis }: { children: ReactNode; papeis?: string[] }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <p className="py-3">Carregando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (papeis && !usuario.papeis.some((p) => papeis.includes(p))) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
