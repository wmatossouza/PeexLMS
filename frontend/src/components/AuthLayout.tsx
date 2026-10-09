import type { ReactNode } from 'react'

const DESTAQUES = ['Cursos e trilhas em um só lugar', 'Acompanhe seu progresso aula a aula', 'Quiz ao final para fixar o conteúdo']

export function AuthLayout({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-linear-to-br from-primary to-capa-1-para p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-base font-bold">P</span>
          <span className="text-lg font-bold tracking-tight">Peex Learning</span>
        </div>
        <div>
          <h2 className="!mt-0 text-4xl font-bold leading-tight tracking-tight text-white">
            Aprenda no seu ritmo, evolua todos os dias.
          </h2>
          <ul className="mt-6 flex list-none flex-col gap-3 p-0 text-base text-white/90">
            {DESTAQUES.map((d) => (
              <li key={d} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20" aria-hidden="true">
                  ✓
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/70">© 2026 Peex Learning</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-white">P</span>
            <span className="text-lg font-bold tracking-tight text-text">Peex Learning</span>
          </div>
          <h1 className="!mt-0">{titulo}</h1>
          <p className="mb-6 text-text-muted">{subtitulo}</p>
          {children}
        </div>
      </section>
    </div>
  )
}
