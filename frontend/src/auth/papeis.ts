// Admin/Instrutor são perfis de gestão: acompanham alunos e cadastram conteúdo, mas não estudam.
export function ehGestor(papeis: string[] | undefined) {
  return !!papeis?.some((p) => p === 'Admin' || p === 'Instrutor')
}

export function ehAluno(papeis: string[] | undefined) {
  return !ehGestor(papeis) && !!papeis?.includes('Aluno')
}
