import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'

export function RegisterPage() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await registrar(nome, email, senha)
      navigate('/')
    } catch {
      setErro('Não foi possível criar a conta. Verifique os dados (senha precisa ter ao menos 8 caracteres).')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Criar conta" subtitulo="Comece agora a acompanhar seus estudos.">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={8} />
        </label>
        {erro && <p className="text-danger">{erro}</p>}
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar conta'}
        </Button>
        <p className="text-sm text-text-muted">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
