import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastTipo = 'sucesso' | 'erro'

interface ToastItem {
  id: number
  texto: string
  tipo: ToastTipo
}

interface ToastContextValue {
  notificar: (texto: string, tipo?: ToastTipo) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const notificar = useCallback((texto: string, tipo: ToastTipo = 'sucesso') => {
    const id = Date.now() + Math.random()
    setToasts((atual) => [...atual, { id, texto, tipo }])
    setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      <div
        className="fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${
              t.tipo === 'sucesso' ? 'bg-success' : 'bg-danger'
            }`}
          >
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
