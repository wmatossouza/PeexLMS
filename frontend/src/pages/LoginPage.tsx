import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/http'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch (err) {
      setErro(err instanceof ApiError && err.status === 401 ? 'Email ou senha inválidos.' : err instanceof ApiError && err.status === 423 ? 'Conta temporariamente bloqueada. Tente novamente mais tarde.' : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  function preencherTeste(tipo: 'admin' | 'aluno') {
    if (tipo === 'admin') {
      setEmail('admin@demo.com')
      setSenha('Demo@12345')
    } else {
      setEmail('ana@demo.com')
      setSenha('Demo@12345')
    }
    setErro(null)
  }

  if (usuario) return <Navigate to="/" replace />

  return (
    <AuthLayout titulo="Entrar" subtitulo="Acesse sua conta para continuar aprendendo.">
      {import.meta.env.DEV && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-warning bg-surface px-3 py-1 text-xs text-text-muted">
          <span className="font-semibold text-warning">DEV</span>
          <span>Ambiente de teste:</span>
          <Button type="button" variant="secundario" className="px-2 py-0.5 text-xs" onClick={() => preencherTeste('admin')}>
            Preencher Admin
          </Button>
          <Button type="button" variant="secundario" className="px-2 py-0.5 text-xs" onClick={() => preencherTeste('aluno')}>
            Preencher Aluno
          </Button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        {erro && <p className="text-danger">{erro}</p>}
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </Button>
        <p className="text-sm text-text-muted">
          Não tem conta? <Link to="/registrar">Criar conta</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
