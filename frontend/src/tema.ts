export type PreferenciaTema = 'claro' | 'escuro' | 'sistema'

const CHAVE = 'tema'
const consultaEscuro = () => window.matchMedia('(prefers-color-scheme: dark)')

export function lerPreferencia(): PreferenciaTema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo === 'claro' || salvo === 'escuro' || salvo === 'sistema') return salvo
  } catch {
    // storage indisponível (modo privado, etc.): cai no padrão
  }
  return 'sistema'
}

export function aplicarTema(pref: PreferenciaTema) {
  const escuro = pref === 'escuro' || (pref === 'sistema' && consultaEscuro().matches)
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro'
}

export function salvarPreferencia(pref: PreferenciaTema) {
  try {
    localStorage.setItem(CHAVE, pref)
  } catch {
    // sem persistência: vale só nesta sessão
  }
  aplicarTema(pref)
}

// No modo "sistema", acompanha a troca de tema do SO em tempo real.
export function acompanharSistema() {
  const consulta = consultaEscuro()
  const aoMudar = () => lerPreferencia() === 'sistema' && aplicarTema('sistema')
  consulta.addEventListener('change', aoMudar)
  return () => consulta.removeEventListener('change', aoMudar)
}
