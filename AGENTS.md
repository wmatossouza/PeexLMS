# AGENTS.md — Guia para IAs de desenvolvimento

Este arquivo orienta qualquer agente de IA (Claude Code, Copilot, etc.) que
trabalhar neste repositório. Leia antes de gerar ou alterar código. Para o
"o quê" e "por quê" do produto, ver `PRD.md`. Para o visual, ver `DESIGN.md`.

## Stack e estrutura

```
ProjPeex2026/
├── backend/     .NET 8 Minimal API + EF Core + SQL Server
├── frontend/    React + TypeScript + Vite
└── docker-compose.yml
```

- Backend usa **Minimal APIs**, não Controllers. Não introduza um
  `[ApiController]`/Controller a menos que explicitamente pedido.
- Frontend usa **function components + hooks**. Não introduza class
  components nem uma lib de state management (Redux, Zustand, etc.) até que
  a complexidade do estado realmente justifique — hoje `useState`/`useEffect`
  bastam.
- Acesso a dados sempre via **Entity Framework Core**. Nunca escrever SQL
  concatenado manualmente — se precisar de SQL puro por performance, use
  `FromSqlInterpolated` (parametrizado), nunca `FromSqlRaw` com interpolação
  de string do usuário.

## Regras de segurança (não negociáveis)

Estas regras existem porque o produto lida com dados de usuários e precisa
ser resistente a ataques comuns (ver seção 7.1 do `PRD.md`). Não contorne
por conveniência de desenvolvimento.

1. **Nunca commitar segredos.** Connection strings, chaves JWT e senhas só
   existem em variáveis de ambiente (`.env`, ignorado pelo git) ou em
   `docker-compose.yml` referenciando `${VARIAVEL}`. Se precisar de um valor
   de exemplo, coloque em `.env.example` com um placeholder óbvio.
2. **Todo endpoint que muda ou lê dado de um usuário exige `[Authorize]`.**
   Só endpoints públicos por design (catálogo de trilhas, login, registro)
   ficam sem autenticação.
3. **Nunca use `AllowAnyOrigin()` no CORS em código que vai para produção.**
   A lista de origens permitidas vem de configuração (`Cors:AllowedOrigins`).
4. **Todo input do cliente é validado no backend**, mesmo que o frontend já
   valide. Validação no frontend é UX; validação no backend é segurança.
5. **Nunca use `dangerouslySetInnerHTML`** no React com conteúdo que venha
   de um usuário ou da API sem sanitização explícita.
6. **Senhas nunca são armazenadas nem logadas em texto puro.** Use sempre o
   fluxo do ASP.NET Identity para hashing.
7. **Tokens JWT de acesso não vão para `localStorage`** (fica em memória no
   frontend, ex: contexto React) — reduz o impacto de um XSS. O refresh
   token vive em cookie `HttpOnly` + `Secure` + `SameSite=Strict`.
8. Ao adicionar uma dependência nova (pacote NuGet ou npm), verifique se ela
   é mantida ativamente — não adicione libs abandonadas ou com
   vulnerabilidades conhecidas sem avaliar antes.

Se uma tarefa pedir algo que conflita com essas regras (ex: "desativa o CORS
pra testar rápido"), implemente a alternativa segura (ex: adicionar a origem
específica à lista) em vez de contornar a regra, e avise o usuário.

## Convenções de código

### Backend (.NET)

- Namespace raiz: `Peex.Api`.
- Entidades em `Models/`, `DbContext` em `Data/`, lógica de negócio que não
  é só CRUD direto vai em `Services/` (crie a pasta quando a primeira regra
  de negócio não-trivial aparecer — ex: cálculo de progresso, recomendação).
- Endpoints agrupados por recurso com `MapGroup` (ver `Program.cs` como
  referência do padrão já estabelecido em `/api/items`).
- Nomes de propriedades de entidades em português (`Nome`, `Descricao`,
  `CriadoEm`), consistente com o domínio do produto já em uso.
- Toda mudança em uma entidade (`Models/*.cs`) exige gerar uma migration
  nova (`dotnet ef migrations add NomeDescritivo`) — nunca editar uma
  migration já aplicada.

### Frontend (React)

- Um componente por arquivo `.tsx` dentro de `src/` (`src/components/` para
  componentes reutilizáveis, `src/components/ui/` para os primitivos
  visuais — `Button`, `Badge`, `Card`).
- Chamadas HTTP centralizadas em módulos `src/api/<recurso>.ts` —
  componentes não fazem `fetch` direto.
- Tipos TypeScript das entidades espelham o formato retornado pela API
  (nomes de campo em português, igual ao backend).
- Estilo: **Tailwind CSS v4** (classes utilitárias direto no `className`),
  configurado via `@theme` em `frontend/src/index.css` — ver `DESIGN.md`
  para os tokens e os primitivos de `components/ui/`. Nunca cor solta
  (`bg-[#...]`) nem classe de cor padrão do Tailwind fora dos tokens
  (`bg-indigo-600`) — sempre os tokens semânticos (`bg-primary`,
  `text-danger`, etc.). Sem lib de componentes completa (Material UI, Ant
  Design, shadcn/ui) nesta fase — ver `DESIGN.md`.

## O que evitar

- Não adicionar abstrações para casos hipotéticos ("pode ser que no futuro
  precise de X"). Resolva o problema atual.
- Não duplicar validação de regra de negócio em frontend e backend de forma
  divergente — a fonte da verdade é sempre o backend.
- Não usar `.Result` ou `.Wait()` em código assíncrono do .NET (bloqueia
  threads) — sempre `async`/`await` de ponta a ponta.
- Não misturar responsabilidade de UI com chamada de API no mesmo trecho
  sem necessidade — mantenha a separação já estabelecida (`api.ts` vs
  `App.tsx`).

## Fluxo de trabalho

- Build/execução: ver `README.md` (`docker compose up --build`).
- Após alterar uma entidade do backend, gerar migration antes de considerar
  a tarefa concluída (senão o banco fica dessincronizado do modelo).
- Antes de finalizar qualquer tarefa que toque autenticação, autorização,
  ou acesso a dados de outro usuário, rode uma revisão de segurança nas
  mudanças (skill `security-review` — ver `SKILLS.md`).
