import { getAccessToken } from '../auth/tokenStore'

const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const MENSAGEM_GENERICA = 'Não foi possível concluir a ação. Tente novamente.'
const MAX_MENSAGEM = 200

// Só erros de validação (400/409/422) trazem mensagem do servidor, e mesmo assim
// curta e em texto puro. Qualquer outro status (401, 403, 404, 5xx...) vira mensagem
// genérica, para nunca exibir detalhe interno, stack trace ou HTML de erro.
async function mensagemSegura(res: Response): Promise<string> {
  if (![400, 409, 422].includes(res.status)) return MENSAGEM_GENERICA

  const texto = (await res.text()).trim()
  if (!texto) return MENSAGEM_GENERICA

  try {
    const json = JSON.parse(texto) as { errors?: Record<string, string[]>; mensagem?: string }
    const primeira = json.errors ? Object.values(json.errors).flat()[0] : json.mensagem
    if (typeof primeira === 'string' && primeira.length <= MAX_MENSAGEM) return primeira
    return MENSAGEM_GENERICA
  } catch {
    const pareceHtmlOuCodigo = /[<>{}]|\bat\s+\S+\s*\(|Exception/.test(texto)
    return texto.length <= MAX_MENSAGEM && !pareceHtmlOuCodigo ? texto : MENSAGEM_GENERICA
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 204) return undefined as T

  if (!res.ok) throw new ApiError(await mensagemSegura(res), res.status)

  return res.json() as Promise<T>
}
