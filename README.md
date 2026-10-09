# Peex Learning

Um LMS (plataforma de ensino) simples, feito para praticar **React + C# + Claude Code**.
O **aluno** estuda cursos e trilhas, conclui aulas, responde quizzes e acompanha seu
progresso. O **administrador** cadastra conteúdo e acompanha o andamento dos alunos em um painel.

> Projeto de estudo/demonstração. Os dados e as contas de exemplo servem só para uso local.

## O que tem

**Aluno**
- Login/cadastro, catálogo de cursos com busca e filtro por nível, trilhas de aprendizagem
- Página da aula com **vídeo** (YouTube ou arquivo `.mp4`) e **texto de estudo**, navegação entre aulas
- Conclusão de aulas, **quiz** por curso com resultado imediato e progresso por curso/trilha
- Tela inicial com "Continue de onde parou"

**Administrador / Instrutor** (perfil de gestão — não faz cursos)
- **Painel** com indicadores, progresso médio por curso, atividade dos últimos 14 dias e alunos parados
- **Alunos**: andamento individual, situação (ativo / parado / sem atividade), busca e filtros
- **Conteúdo**: criar cursos, trilhas, aulas (com texto de estudo) e quizzes; pré-visualizar o curso

**Geral**: tema claro/escuro/sistema, layout responsivo, mensagens de erro genéricas (sem detalhes técnicos).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | .NET 8 Minimal API, Entity Framework Core, ASP.NET Identity, JWT |
| Banco | SQL Server 2022 |
| Infra | Docker Compose |

## Como rodar (Docker)

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e **em execução**.

```bash
# 1. clonar
git clone <url-do-repositorio>
cd ProjPeex2026

# 2. criar o arquivo de configuração local
cp .env.example .env
```

3. Edite o `.env` e defina valores **seus** (o arquivo é ignorado pelo git):

| Variável | O que é |
|---|---|
| `MSSQL_SA_PASSWORD` | Senha do SQL Server — mínimo 8 caracteres com maiúscula, minúscula, número e símbolo |
| `JWT_KEY` | Chave de assinatura dos tokens — **mínimo 32 caracteres**, aleatória |

Para gerar uma `JWT_KEY` segura:

```bash
# Linux / macOS / Git Bash
openssl rand -base64 64
```

```powershell
# Windows PowerShell
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

```bash
# 4. subir tudo (a primeira vez demora alguns minutos)
docker compose up --build
```

Quando terminar de subir (o backend espera o banco ficar saudável, cerca de 30–60 s):

| Serviço | URL |
|---|---|
| Aplicação (frontend) | http://localhost:5173 |
| API | http://localhost:5000 |
| Documentação da API (Swagger, só em desenvolvimento) | http://localhost:5000/swagger |
| SQL Server | `localhost:1433` (usuário `sa`) |

As portas ficam acessíveis **apenas no seu computador** (`127.0.0.1`). As migrations do banco
são aplicadas automaticamente na inicialização do backend.

### Popular com dados de demonstração

Um banco novo vem vazio e **sem administrador**. O script abaixo cria o administrador de
demonstração, 15 cursos (com vídeo, texto e quiz), 4 trilhas e 5 alunos com progresso variado.
Pode rodar mais de uma vez: ele não duplica nada.

```powershell
# Windows PowerShell (com os containers rodando)
powershell -ExecutionPolicy Bypass -File scripts/seed.ps1
```

| Perfil | Email | Senha |
|---|---|---|
| Administrador | `admin@demo.com` | `Demo@12345` |
| Aluno | `ana@demo.com` (também `bruno`, `carla`, `diego`, `elisa` `@demo.com`) | `Demo@12345` |

> Essas contas existem **só para demonstração local**. Nunca use essas senhas fora do seu computador.
> Em modo de desenvolvimento, a tela de login mostra uma faixa **DEV** com botões que preenchem
> essas credenciais (ela some no build de produção).

Os vídeos de exemplo vêm de servidores públicos externos, então as aulas em vídeo precisam de internet.

### Sem dados de demonstração

Também dá para criar tudo pela interface: cadastre-se em `/registrar` (entra como **Aluno**)
e promova a primeira conta a administrador:

```bash
docker exec peex-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<senha do .env>" -C -d PeexDb -Q "
DELETE ur FROM AspNetUserRoles ur JOIN AspNetUsers u ON u.Id = ur.UserId
WHERE u.Email = 'email@do-usuario.com';
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id FROM AspNetUsers u, AspNetRoles r
WHERE u.Email = 'email@do-usuario.com' AND r.Name = 'Admin';"
```

O comando **substitui** o papel `Aluno` por `Admin`: administrador/instrutor é um perfil de gestão
e não estuda — o backend recusa (403) concluir aula ou responder quiz para quem não é `Aluno`.
Depois de promover, faça login de novo (os papéis ficam dentro do token).

## Papéis

| Papel | Pode |
|---|---|
| `Aluno` (padrão no cadastro) | Estudar: ver cursos/trilhas, concluir aulas, responder quizzes |
| `Instrutor` | Cadastrar cursos, trilhas, aulas e quizzes; ver relatórios |
| `Admin` | Tudo do instrutor |

## Comandos úteis

```bash
docker compose ps                    # status dos containers
docker compose logs -f backend       # logs do backend
docker compose up --build backend    # rebuild do backend (não tem hot-reload)
docker compose down                  # para tudo, mantém os dados
docker compose down -v               # para tudo e APAGA o banco
```

- O **frontend** tem hot-reload: editar `frontend/src` reflete sem rebuild.
- Verificações do frontend (dentro do container):
  `docker compose exec frontend npx tsc -b` e `docker compose exec frontend npx oxlint`
- Nova migration após alterar uma entidade em `backend/Models`:

```bash
docker run --rm -v "${PWD}/backend:/app" -w /app mcr.microsoft.com/dotnet/sdk:8.0 sh -c \
  "dotnet tool install --global dotnet-ef --version 8.0.11 || true && export PATH=\$PATH:/root/.dotnet/tools && dotnet ef migrations add NomeDaMigration"
```

## Rodar sem Docker (opcional)

Requer .NET 8 SDK, Node 20+ e um SQL Server acessível.

```bash
# backend (os segredos vão por variável de ambiente)
cd backend
export ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=PeexDb;User Id=sa;Password=<sua senha>;TrustServerCertificate=True;"
export Jwt__Key="<chave de 32+ caracteres>"
export ASPNETCORE_ENVIRONMENT=Development
dotnet run

# frontend (outro terminal) — ajuste VITE_API_URL para a URL/porta em que o backend subiu
cd frontend
npm install
VITE_API_URL=http://localhost:5000 npm run dev
```

O backend **não inicia** sem `Jwt:Key` (32+ caracteres) e sem a connection string — nenhum segredo fica no repositório.

## Estrutura

```
ProjPeex2026/
├── backend/            API .NET 8 (Minimal APIs)
│   ├── Endpoints/      Rotas por recurso (Auth, Curso, Aula, Quiz, Progresso, Trilha, Relatório)
│   ├── Models/ Dtos/   Entidades e contratos
│   ├── Data/           DbContext
│   ├── Services/       TokenService (JWT)
│   └── Migrations/     Migrations do EF Core
├── frontend/           React + TypeScript
│   └── src/            pages/, components/, api/, auth/
├── scripts/            seed.ps1 (dados de demonstração)
├── docker-compose.yml
├── PRD.md              Requisitos do produto
├── DESIGN.md           Sistema de design (tokens, componentes, temas)
└── AGENTS.md           Convenções para agentes de IA / contribuidores
```

## Principais endpoints

| Endpoint | Acesso | Descrição |
|---|---|---|
| `POST /api/auth/registrar` · `login` · `refresh` · `logout` | público / cookie | Autenticação |
| `GET /api/cursos` · `GET /api/cursos/{id}` | público | Catálogo e detalhe do curso |
| `GET /api/trilhas` · `GET /api/trilhas/{id}` | público | Trilhas |
| `POST/PUT/DELETE /api/cursos` · `/api/trilhas` · `/api/aulas` · `/api/quiz` | Admin/Instrutor | Gestão de conteúdo |
| `POST/DELETE /api/progresso/aulas/{id}/concluir` | Aluno | Concluir / desmarcar aula |
| `GET /api/progresso/meus-cursos` | Aluno | Progresso do aluno |
| `GET /api/cursos/{id}/quiz/responder` · `POST /api/quiz/{id}/responder` | Aluno | Responder quiz |
| `GET /api/progresso/cursos/{id}/alunos` | Admin/Instrutor | Progresso dos alunos em um curso |
| `GET /api/relatorios/resumo` | Admin/Instrutor | Dados do painel |

A lista completa está no Swagger.

## Segurança

- Segredos (`.env`) nunca vão para o git; o backend recusa iniciar sem eles.
- Access token JWT (15 min) só em memória no frontend; refresh token em cookie `HttpOnly` + `SameSite=Strict`.
- Senhas com hash do ASP.NET Identity e bloqueio de conta após tentativas falhas.
- CORS restrito às origens configuradas (`Cors:AllowedOrigins`); entrada validada no backend.
- Erros inesperados devolvem mensagem genérica com um `traceId` — o detalhe fica só no log do servidor.
- Antes de qualquer deploy: troque senhas e chaves, desative o Swagger e revise o `AGENTS.md` e a seção 7.1 do `PRD.md`.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `error during connect ... dockerDesktopLinuxEngine` | O Docker Desktop não está em execução |
| `defina JWT_KEY no arquivo .env` | Faltou criar o `.env` (copie o `.env.example`) |
| Backend reinicia em loop | `JWT_KEY` com menos de 32 caracteres, ou senha do SQL Server fraca demais |
| Login do admin falha depois de `down -v` | O banco foi apagado: rode o `scripts/seed.ps1` de novo |
| Porta em uso (5173, 5000 ou 1433) | Outro programa usa a porta; pare-o ou ajuste o `docker-compose.yml` |

## Documentação

- [`PRD.md`](PRD.md) — o quê e por quê do produto
- [`DESIGN.md`](DESIGN.md) — tokens, componentes e temas do frontend
- [`AGENTS.md`](AGENTS.md) — convenções e regras de segurança do projeto
