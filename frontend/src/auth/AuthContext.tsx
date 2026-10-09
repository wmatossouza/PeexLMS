import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { setAccessToken } from './tokenStore'

interface Usuario {
  nome: string
  email: string
  papeis: string[]
}

interface AuthContextValue {
  usuario: Usuario | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  registrar: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    authApi.refresh().then((resposta) => {
      if (resposta) {
        setAccessToken(resposta.accessToken)
        setUsuario({ nome: resposta.nome, email: resposta.email, papeis: resposta.papeis })
      }
      setCarregando(false)
    })
  }, [])

  async function login(email: string, senha: string) {
    const resposta = await authApi.login(email, senha)
    setAccessToken(resposta.accessToken)
    setUsuario({ nome: resposta.nome, email: resposta.email, papeis: resposta.papeis })
  }

  async function registrar(nome: string, email: string, senha: string) {
    const resposta = await authApi.registrar(nome, email, senha)
    setAccessToken(resposta.accessToken)
    setUsuario({ nome: resposta.nome, email: resposta.email, papeis: resposta.papeis })
  }

  async function logout() {
    await authApi.logout()
    setAccessToken(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
