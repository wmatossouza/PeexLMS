# PRD — Peex Learning (plataforma de trilhas de aprendizado)

## 0. Contexto: o desafio (fonte da verdade — briefing interno do desafio, não incluído neste repositório)

Este projeto é a entrega de William no **LMS Challenge 2026**, um desafio
interno da Peex com 10 desenvolvedores, todos com o mesmo briefing. O
objetivo real do desafio **não é o LMS em si** — é praticar uma stack nova
(React + C# + Claude Code). O LMS é o "laboratório": deliberadamente simples,
"básico funcionando primeiro, diferenciais depois".

**Fluxo mínimo obrigatório** (se funcionar, o desafio funcional foi
cumprido — ver seção 5.1):
- **Admin:** Login → Criar curso → Criar aula → Criar quiz → Ver progresso
  dos alunos.
- **Aluno:** Login → Ver cursos → Acessar aula → Concluir aula → Responder
  quiz + ver progresso.

**Critérios de avaliação** (2, mesmo peso, nota de 1 a 5 cada — insuficiente
· parcial · bom · muito bom · excelente):
1. **Funcionalidade** — o fluxo mínimo acima funciona?
2. **Experiência** — a solução é simples e intuitiva?

Não há critério de avaliação sobre segurança, gamificação ou volume de
funcionalidades extras. Isso não significa que segurança básica deve ser
ignorada (ver seção 7.1), mas significa que **tempo de desenvolvimento deve
priorizar o fluxo mínimo antes de qualquer diferencial**.

**Regras do desafio:**
- Desenvolvimento individual.
- React obrigatório no front-end; C# obrigatório no back-end.
- Claude Code precisa fazer parte do processo de desenvolvimento.
- Bibliotecas e banco de dados são de livre escolha.
- Extras são bem-vindos, mas não substituem o básico.
- Todo código apresentado deve poder ser explicado pelo autor.

**Apresentação:** 10 min — 7 min de demonstração (fluxos admin e aluno), 2
min sobre como foi construído (o que foi fácil/difícil, onde a IA ajudou), 1
min destacando o ponto forte do projeto.

## 1. Visão geral

Plataforma de ensino online: o aluno acessa **cursos** compostos por
**aulas**, conclui aulas, responde um **quiz** e acompanha seu progresso. O
administrador cadastra cursos, aulas e quizzes, e visualiza o progresso dos
alunos.

Stack já definida (ver `README.md`): React + TypeScript (frontend), .NET 8
Minimal API (backend), SQL Server (dados), tudo containerizado com Docker.

## 2. Objetivos

- Entregar o fluxo mínimo do desafio (seção 0) funcionando de ponta a ponta,
  com prioridade sobre qualquer outra funcionalidade.
- Ser simples e intuitivo de usar (critério "Experiência").
- Registrar e visualizar progresso de forma confiável (retomar de onde
  parou).
- Ser razoavelmente seguro por padrão (autenticação, proteção contra os
  riscos mais comuns de aplicações web), sem que isso atrase o fluxo mínimo.

## 3. Não-objetivos (fora do escopo desta fase)

- Pagamentos/assinaturas.
- Produção/upload de vídeo (assume-se conteúdo já hospedado externamente,
  referenciado por URL).
- Fórum de discussão ou comunidade entre alunos.
- Aplicativo mobile nativo (o frontend web deve ser responsivo, mas não há
  app nativo nesta fase).
- **Sistema de recomendação e gamificação (badges/XP/certificados) são
  diferenciais, não fazem parte do fluxo avaliado** — só devem ser
  trabalhados depois que o fluxo mínimo (seção 5.1) estiver completo e
  demonstrável.

## 4. Personas

O desafio define apenas dois ambientes; o projeto já implementa um terceiro
papel (`Instrutor`) como extensão do papel `Admin` — mantido, mas não é
exigido pelo briefing.

| Persona | Necessidade principal |
|---|---|
| **Aluno** | Ver os cursos, estudar no seu ritmo, concluir aulas, responder o quiz e ver seu progresso |
| **Administrador** | Perfil estratégico: acompanhar o andamento dos alunos (painel, relatórios, alunos parados), cadastrar cursos, trilhas, aulas e quizzes. **Não faz cursos** — só o papel `Aluno` estuda (o backend recusa concluir aula/responder quiz com 403 para os demais) |
| **Instrutor** *(extra, além do briefing)* | Mesmas permissões de cadastro do Admin, sem gestão de usuários |

## 5. Escopo funcional

### 5.1 Fluxo mínimo obrigatório (prioridade máxima — é o que é avaliado)

- **Admin:** Login → Criar curso → Criar aula (dentro do curso) → Criar quiz
  (associado ao curso) → Ver progresso dos alunos (por curso).
- **Aluno:** Login → Ver lista de cursos → Acessar aula → Concluir aula →
  Responder quiz do curso → Ver resultado do quiz e progresso no curso.

**Critérios de aceite:**
- Os dois fluxos acima funcionam de ponta a ponta, sem etapas quebradas ou
  que exijam intervenção manual (ex: banco de dados direto).
- A interface é simples o suficiente para ser demonstrada em ~7 minutos sem
  confundir quem assiste.

### 5.2 Cursos e aulas (núcleo do produto)

- **Curso**: composto por uma lista ordenada de aulas.
- **Aula**: unidade de conteúdo (vídeo, texto ou ambos), pertence a um curso.
- Um aluno pode navegar pelo catálogo de cursos, ver detalhes de um curso
  antes de começar, e iniciar uma aula.

**Critérios de aceite:**
- Listar cursos.
- Página de curso mostra a lista de aulas e permite retomar da última aula
  assistida.

### 5.3 Quiz (obrigatório — parte do fluxo mínimo)

- Cada curso tem **um quiz simples** associado, cadastrado pelo admin depois
  das aulas.
- Quiz é composto por uma ou mais perguntas de múltipla escolha, cada uma
  com uma alternativa correta definida pelo admin.
- O aluno responde o quiz e vê o resultado imediatamente (nº de acertos /
  total, e se atingiu um mínimo — ex: aprovado/reprovado, ou simplesmente o
  placar).
- Responder o quiz faz parte do progresso do curso (não é uma tela isolada
  sem relação com o restante do fluxo).

**Critérios de aceite:**
- Admin cria um quiz com N perguntas de múltipla escolha para um curso.
- Aluno responde o quiz e recebe o resultado na hora, sem recarregar
  manualmente ou consultar outro lugar.
- Reenviar o quiz é permitido (mantém simples — não precisa de "tentativas
  limitadas" nesta fase); apenas o resultado mais recente é exibido/contado
  no progresso.

### 5.4 Acompanhamento de progresso

- Ao concluir uma aula, o sistema registra a conclusão vinculada ao aluno.
- Progresso do curso = (aulas concluídas + quiz respondido) sobre o total de
  itens do curso.
- Aluno tem uma área "Meu progresso" com os cursos em andamento e
  concluídos, e retomada rápida ("Continuar de onde parei").
- Admin vê, por curso, quais alunos concluíram quais aulas e o resultado do
  quiz.

**Critérios de aceite:**
- Progresso persiste entre sessões e dispositivos (fica no backend, não
  apenas no navegador).
- Marcar uma aula como concluída é idempotente (marcar de novo não duplica
  registro nem quebra o cálculo de progresso).

### 5.5 Trilhas (diferencial, já implementado — não é o núcleo avaliado)

- **Trilha**: agrupamento temático de cursos em ordem sugerida (ex: "Formação
  Frontend React"). Cursos podem existir fora de uma trilha (avulsos).
- Já implementado no código (`Trilha`, `TrilhaCurso`) antes da revisão de
  escopo baseada no briefing — mantido porque já funciona e não conflita com o
  fluxo mínimo, mas não deve receber mais esforço além de manutenção até que
  o fluxo mínimo (5.1–5.4) esteja completo e demonstrável.

**Critérios de aceite (já atendidos):**
- Listar trilhas com filtro por tema/nível (iniciante/intermediário/avançado).
- Página de trilha mostra os cursos em ordem, com indicação visual de
  concluído / em andamento / não iniciado.

### 5.6 Sistema de sugestões/recomendação (diferencial — não iniciar antes do fluxo mínimo)

- Ao concluir um curso, sugerir o próximo curso da mesma trilha
  automaticamente.
- Painel "Recomendado para você" na home, baseado em regra simples de
  similaridade (não é necessário machine learning).

**Critérios de aceite:**
- A lógica de recomendação é isolada em um serviço próprio no backend
  (`IRecommendationService`), para poder evoluir a regra sem afetar o resto
  da API.

### 5.7 Gamificação (diferencial — não iniciar antes do fluxo mínimo)

- **Badges**: concedidos automaticamente ao concluir um curso ou trilha.
- **Pontos de experiência (XP)**: cada aula concluída soma XP.
- **Certificado**: gerado (PDF) ao concluir 100% de uma trilha.

**Critérios de aceite:**
- Badges e certificados ficam disponíveis na área de perfil do aluno.
- Emissão de certificado é auditável (registro de quando foi emitido).

## 6. Modelo de dados (visão de alto nível)

```
Usuario 1───N Matricula N───1 Trilha
Trilha  1───N TrilhaCurso N───1 Curso
Curso   1───N Aula
Curso   1───1 Quiz
Quiz    1───N QuizPergunta
QuizPergunta 1───N QuizOpcao
Usuario 1───N ProgressoAula N───1 Aula
Usuario 1───N QuizResposta N───1 Quiz
Usuario 1───N Badge
Usuario 1───N Certificado N───1 Trilha
```

Entidades principais (nomes de tabela sugeridos, em português para manter
consistência com o domínio de negócio; nomes de propriedades em C# seguem
PascalCase padrão .NET):

- `Usuario` — Id, Nome, Email, SenhaHash (gerenciado pelo ASP.NET Identity),
  CriadoEm.
- `Trilha` *(diferencial)* — Id, Titulo, Descricao, Nivel, Categoria, CriadoEm.
- `Curso` — Id, Titulo, Descricao, Nivel, CriadoEm.
- `TrilhaCurso` *(diferencial)* — TrilhaId, CursoId, Ordem (tabela de
  associação N:N com ordem explícita).
- `Aula` — Id, CursoId, Titulo, TipoConteudo (video/texto), UrlConteudo,
  Ordem, DuracaoMinutos.
- `Quiz` — Id, CursoId (único por curso), Titulo.
- `QuizPergunta` — Id, QuizId, Enunciado, Ordem.
- `QuizOpcao` — Id, QuizPerguntaId, Texto, Correta (bool).
- `QuizResposta` — Id, UsuarioId, QuizId, Acertos, Total, RespondidoEm
  (registra a tentativa mais recente; ver 5.3 sobre reenvio).
- `ProgressoAula` — UsuarioId, AulaId, ConcluidoEm.
- `Badge` *(diferencial)* — Id, UsuarioId, Tipo, ConcedidoEm.
- `Certificado` *(diferencial)* — Id, UsuarioId, TrilhaId, EmitidoEm,
  CodigoValidacao.

## 7. Requisitos não-funcionais

### 7.1 Segurança (boa prática, não é critério formal de avaliação — mas não deve ser ignorada)

- **Autenticação:** JWT (access token de curta duração, ~15 min) + refresh
  token (armazenado como cookie `HttpOnly`, `Secure`, `SameSite=Strict`) via
  **ASP.NET Identity**, que já cuida de hashing de senha (PBKDF2) e políticas
  de senha forte.
- **Autorização:** endpoints sensíveis exigem `[Authorize]`; papéis
  (`Aluno`, `Instrutor`, `Admin`) via `Roles` do Identity.
- **Proteção contra invasões comuns (OWASP Top 10):**
  - *SQL Injection*: mitigado por padrão pelo EF Core (queries parametrizadas
    — nunca concatenar SQL manualmente).
  - *XSS*: React escapa conteúdo por padrão; nunca usar `dangerouslySetInnerHTML`
    com conteúdo não sanitizado; `Content-Security-Policy` configurado no
    backend/nginx.
  - *CSRF*: mitigado por usar Bearer token em vez de cookie para o access
    token; o refresh token em cookie usa `SameSite=Strict`.
  - *Exposição de dados sensíveis*: HTTPS obrigatório em produção, segredos
    (connection string, chave JWT) via variáveis de ambiente/Docker
    secrets — nunca hardcoded ou commitado no repositório.
  - *Validação de entrada*: DTOs com `DataAnnotations`/`FluentValidation` em
    todos os endpoints que recebem dados do cliente.
- **CORS:** lista explícita de origens permitidas (nunca `AllowAnyOrigin`
  em produção).

Itens como rate limiting agressivo e auditoria estruturada de eventos são
bem-vindos, mas são diferenciais — não bloqueiam a entrega do fluxo mínimo.

### 7.2 Performance e escalabilidade

- Paginação em listagens que podem crescer bastante (cursos, aulas) —
  não é bloqueante para o fluxo mínimo com poucos registros de teste.

### 7.3 Acessibilidade e usabilidade

- Layout responsivo (mobile-first).
- Contraste de cores dentro do padrão WCAG AA (ver `DESIGN.md`).
- Navegação por teclado nos componentes interativos.
- Isso é o que sustenta o critério de avaliação "Experiência" — mais
  importante nesta fase do que qualquer diferencial da seção 5.5–5.7.

## 8. Arquitetura técnica

- **Frontend:** React + TypeScript (Vite), consumindo a API via `fetch`,
  autenticação com token JWT guardado em memória (não em `localStorage`,
  para reduzir superfície de ataque de XSS) + refresh via cookie `HttpOnly`.
- **Backend:** .NET 8 Minimal API, organizado em camadas: `Endpoints` →
  `Services` (regra de negócio) → `Data`/EF Core (persistência). Ver
  `AGENTS.md` para convenções detalhadas.
- **Banco de dados:** SQL Server, schema versionado via EF Core Migrations.
- **Infraestrutura:** Docker Compose para desenvolvimento/demonstração;
  cada serviço (`db`, `backend`, `frontend`) em container próprio.

## 9. Roadmap

| Fase | Entrega | Prioridade |
|---|---|---|
| **Fase 1 — Fluxo mínimo (seção 5.1)** | Autenticação, CRUD de Curso/Aula (admin), Quiz (criar/responder/resultado), progresso (aula + quiz), catálogo de cursos, "Meu progresso" | **Crítica — é o que é avaliado** |
| **Fase 2 — Polimento de UX** | Estados de loading/erro/vazio, responsividade, acessibilidade (ver `DESIGN.md`) — sustenta o critério "Experiência" | Alta |
| **Fase 3 — Trilhas** | Manter/evoluir o que já existe (agrupamento de cursos) | Diferencial |
| **Fase 4 — Recomendação** | Sugestão de próximo curso/trilha | Diferencial |
| **Fase 5 — Gamificação** | Badges, XP, certificados em PDF | Diferencial |

## 10. Métricas de sucesso

Formais (desafio, ver seção 0): nota de Funcionalidade e nota de Experiência
na apresentação.

Informais (produto, se fosse além do desafio):
- Taxa de conclusão de cursos iniciados.
- Tempo médio até a primeira aula concluída após cadastro.

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Investir tempo em diferenciais (Trilha/recomendação/gamificação) antes do fluxo mínimo estar completo | Seguir a ordem de prioridade da seção 9; só avançar para Fase 3+ com Fase 1 demonstrável |
| Vazamento de credenciais | Segredos fora do código-fonte, `.env` no `.gitignore`, rotação de chave JWT documentada |
| Cálculo de progresso incorreto após mudança na estrutura de um curso (aulas adicionadas/removidas) | Progresso sempre recalculado sob demanda a partir de `ProgressoAula`/`QuizResposta`, nunca armazenado como valor fixo |
| Quiz sem pergunta/opção correta cadastrada (estado inconsistente) | Validação no backend: quiz só é publicado/exibido ao aluno se tiver ao menos 1 pergunta com exatamente 1 opção correta |
