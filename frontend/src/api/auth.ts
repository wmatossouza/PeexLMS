import { apiFetch } from './http'

export interface AuthResponse {
  accessToken: string
  expiraEm: string
  nome: string
  email: string
  papeis: string[]
}

export function registrar(nome: string, email: string, senha: string) {
  return apiFetch<AuthResponse>('/api/auth/registrar', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha }),
  })
}

export function login(email: string, senha: string) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
}

export async function refresh(): Promise<AuthResponse | null> {
  try {
    return await apiFetch<AuthResponse>('/api/auth/refresh', { method: 'POST' })
  } catch {
    return null
  }
}

export function logout() {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' })
}
