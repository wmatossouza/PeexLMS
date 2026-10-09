# SKILLS.md — Skills do Claude Code a usar neste projeto

Este documento mapeia qual Skill do Claude Code invocar em cada tipo de
tarefa deste repositório, para manter consistência entre sessões diferentes
de desenvolvimento. Não é sobre "skills" do produto (competências do aluno
— isso está no `PRD.md`); é sobre o processo de construir o software.

## Mapa de uso

| Situação | Skill | Por quê |
|---|---|---|
| Antes de mergear qualquer mudança em autenticação, autorização, ou acesso a dado de outro usuário | `security-review` | Segurança básica é boa prática (`PRD.md` seção 7.1) mesmo não sendo critério formal do desafio — revisão dedicada evita que uma falha passe despercebida numa revisão de funcionalidade genérica. Não deve atrasar o fluxo mínimo (`PRD.md` seção 5.1), que é o que é avaliado |
| Depois de qualquer conjunto de mudanças, antes de considerar a tarefa pronta | `code-review` | Pega bugs de correção e oportunidades de simplificação antes de virar dívida técnica |
| Ao criar ou alterar qualquer gráfico/dashboard (ex: painel de progresso do aluno, métricas de engajamento no admin) | `dataviz` | Garante paleta e forma visual consistentes em vez de improvisar cores a cada gráfico novo |
| Ao rodar/validar a aplicação depois de uma mudança de UI ou de fluxo (login, marcar aula concluída, etc.) | `run` | Valida o comportamento real no navegador, não só que o código compila |
| Ao revisar/limpar código sem estar atrás de bugs (reuso, abstrações desnecessárias) | `simplify` | Mantém o código alinhado aos princípios de "sem abstração prematura" do `AGENTS.md` |
| Ao configurar permissões do harness ou hooks do repositório (ex: liberar comandos `dotnet`/`npm` recorrentes) | `update-config` | Evita prompts de permissão repetidos no dia a dia |

## Ordem recomendada num ciclo de feature

1. Implementar a feature (seguindo `AGENTS.md` e, se for UI, `DESIGN.md`).
2. `run` — validar manualmente no navegador (login, fluxo de progresso, etc.
   dependendo do que mudou).
3. Se a feature tocou autenticação/autorização/dados de usuário:
   `security-review` primeiro, corrigir o que aparecer.
4. `code-review` (ou `simplify` se o objetivo for só limpeza, não busca de
   bugs) no restante do diff.
5. Gerar migration se um `Models/*.cs` mudou (ver `README.md`), antes de dar
   a tarefa como concluída.

## Por que não usar outras Skills disponíveis aqui

- `design` (canvas de mockup visual) — não é necessário; o `DESIGN.md` já
  define os tokens e componentes, e a implementação vai direto em React.
- Skills de artifact (`artifact-design`, `dataviz` em modo artifact,
  `artifact-capabilities`) — servem para páginas publicadas como Artifact
  fora do repositório; este projeto é uma aplicação real rodando em Docker,
  não um artifact.
- `claude-api` — só se em algum momento a plataforma incorporar um recurso
  de IA de fato (ex: tutor virtual, geração de resumo de aula). Não faz
  parte do escopo atual do `PRD.md`.

Se o escopo do produto mudar para incluir um recurso de IA (ex: chatbot
tutor, geração automática de trilha), adicione uma linha nova aqui indicando
quando consultar a skill `claude-api`.
