# Peex Learning

Um LMS (plataforma de ensino) simples, feito para praticar **React + C# + Claude Code**.
O **aluno** estuda cursos e trilhas, conclui aulas, responde quizzes e acompanha seu progresso.
O **administrador** cadastra conteúdo e acompanha o andamento dos alunos em um painel.

> Projeto de estudo/demonstração, pensado para rodar localmente.

## Como rodar

Você só precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/) **aberto** e de um comando:

```bash
git clone https://github.com/wmatossouza/PeexLMS.git
cd PeexLMS
docker compose up --build
```

Na primeira vez leva alguns minutos (baixa as imagens e compila). Quando terminar, abra
**http://localhost:5173** — o banco, as migrations e os dados de demonstração já vêm prontos.

| Perfil | Email | Senha |
|---|---|---|
| Administrador | `admin@demo.com` | `Demo@12345` |
| Aluno | `ana@demo.com` | `Demo@12345` |

Outros alunos de exemplo: `bruno`, `carla`, `diego`, `elisa` e `fabio` (`@demo.com`, mesma senha).
Esses dados são só para demonstração local.

Para parar: `Ctrl+C` (ou `docker compose down`). Para recomeçar do zero, apagando o banco: `docker compose down -v`.

## O que tem

**Aluno**
- Login/cadastro, catálogo de cursos com busca e filtro por nível, trilhas de aprendizagem
- Página da aula com **vídeo** e **texto de estudo**, navegação entre aulas
- Conclusão de aulas, **quiz** por curso com resultado imediato e progresso por curso/trilha
- Tela inicial com "Continue de onde parou"

**Administrador / Instrutor** (perfil de gestão — não faz cursos)
- **Painel** com indicadores, progresso médio por curso, atividade dos últimos 14 dias e alunos parados
- **Alunos**: andamento individual, situação (ativo / parado / sem atividade), busca e filtros
- **Conteúdo**: criar cursos, trilhas, aulas (com texto de estudo) e quizzes; pré-visualizar o curso

**Geral**: tema claro/escuro/sistema, layout responsivo, mensagens de erro genéricas (sem detalhes técnicos).

## Endereços

| Serviço | URL |
|---|---|
| Aplicação | http://localhost:5173 |
| API | http://localhost:5000 |
| Documentação da API (Swagger) | http://localhost:5000/swagger |
| SQL Server | `localhost:1433` (usuário `sa`) |

As portas ficam acessíveis **apenas no seu computador** (`127.0.0.1`).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | .NET 8 Minimal API, Entity Framework Core, ASP.NET Identity, JWT |
| Banco | SQL Server 2022 |
| Infra | Docker Compose |

## Papéis

| Papel | Pode |
|---|---|
| `Aluno` (padrão no cadastro) | Estudar: ver cursos/trilhas, concluir aulas, responder quizzes |
| `Instrutor` | Cadastrar cursos, trilhas, aulas e quizzes; ver relatórios |
| `Admin` | Tudo do instrutor |

Admin e instrutor **não estudam**: o backend recusa (403) concluir aula ou responder quiz para quem não é `Aluno`.

## Dicas

- O **frontend** tem hot-reload: editar `frontend/src` reflete sem rebuild. O **backend** precisa de
  `docker compose up --build backend` a cada mudança.
- `docker compose logs -f backend` mostra os logs da API.
- Os vídeos de exemplo vêm de servidores públicos: as aulas em vídeo precisam de internet.
- Os dados de demonstração só são criados em desenvolvimento (já é o padrão do `docker-compose.yml`)
  e só se ainda não existirem: rodar de novo não duplica nada.

## Configuração opcional

Funciona sem configurar nada. Se quiser trocar a senha do SQL Server ou fixar a chave dos tokens,
copie `.env.example` para `.env` e edite (o arquivo é ignorado pelo git):

| Variável | Padrão se vazio |
|---|---|
| `MSSQL_SA_PASSWORD` | senha de exemplo, válida só porque o banco aceita conexões apenas locais |
| `JWT_KEY` | uma chave aleatória é gerada a cada subida (você precisa entrar de novo depois de reiniciar o backend) |

Se trocar a senha do SQL Server depois do primeiro uso, rode `docker compose down -v` para recriar o banco.

<details>
<summary><strong>Criar um administrador manualmente</strong> (se não quiser os dados de demonstração)</summary>

Cadastre-se em `/registrar` (entra como Aluno) e promova a conta:

```bash
docker exec peex-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "<senha do SQL Server>" -C -d PeexDb -Q "
DELETE ur FROM AspNetUserRoles ur JOIN AspNetUsers u ON u.Id = ur.UserId
WHERE u.Email = 'email@do-usuario.com';
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id FROM AspNetUsers u, AspNetRoles r
WHERE u.Email = 'email@do-usuario.com' AND r.Name = 'Admin';"
```

Depois de promover, faça login de novo (os papéis ficam dentro do token).
</details>

<details>
<summary><strong>Rodar sem Docker</strong></summary>

Requer .NET 8 SDK, Node 20+ e um SQL Server acessível.

```bash
# backend
cd backend
export ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=PeexDb;User Id=sa;Password=<sua senha>;TrustServerCertificate=True;"
export ASPNETCORE_ENVIRONMENT=Development
export Seed__Demo=true        # opcional: cria os dados de demonstração
dotnet run

# frontend (outro terminal) — ajuste VITE_API_URL para a URL/porta em que o backend subiu
cd frontend
npm install
VITE_API_URL=http://localhost:5000 npm run dev
```

Fora do ambiente `Development` o backend exige `Jwt__Key` (32+ caracteres) e não cria dados de demonstração.
</details>

<details>
<summary><strong>Desenvolvimento</strong></summary>

```bash
docker compose exec frontend npx tsc -b     # checagem de tipos
docker compose exec frontend npx oxlint     # lint
```

Nova migration depois de alterar uma entidade em `backend/Models`:

```bash
docker run --rm -v "${PWD}/backend:/app" -w /app mcr.microsoft.com/dotnet/sdk:8.0 sh -c \
  "dotnet tool install --global dotnet-ef --version 8.0.11 || true && export PATH=\$PATH:/root/.dotnet/tools && dotnet ef migrations add NomeDaMigration"
```
</details>

## Estrutura

```
PeexLMS/
├── backend/            API .NET 8 (Minimal APIs)
│   ├── Endpoints/      Rotas por recurso (Auth, Curso, Aula, Quiz, Progresso, Trilha, Relatório)
│   ├── Models/ Dtos/   Entidades e contratos
│   ├── Data/           DbContext e DbSeeder (dados de demonstração)
│   ├── Services/       TokenService (JWT)
│   └── Migrations/     Migrations do EF Core
├── frontend/           React + TypeScript (pages/, components/, api/, auth/)
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

- Nenhum segredo no repositório: senha e chaves vêm do ambiente (`.env`, ignorado pelo git).
- Access token JWT (15 min) só em memória no frontend; refresh token em cookie `HttpOnly` + `SameSite=Strict`.
- Senhas com hash do ASP.NET Identity e bloqueio de conta após tentativas falhas.
- CORS restrito às origens configuradas; entrada validada no backend.
- Erros inesperados devolvem mensagem genérica com um `traceId` — o detalhe fica só no log do servidor.
- **Antes de qualquer deploy:** defina `JWT_KEY` e a senha do SQL Server, remova os dados de demonstração
  (`Seed__Demo`), desative o Swagger e revise o `AGENTS.md` e a seção 7.1 do `PRD.md`.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `error during connect ... dockerDesktopLinuxEngine` | O Docker Desktop não está aberto |
| Porta em uso (5173, 5000 ou 1433) | Outro programa usa a porta; pare-o ou ajuste o `docker-compose.yml` |
| Login falha com `admin@demo.com` | O banco foi criado sem os dados de demonstração: `docker compose down -v` e suba de novo |
| Tela pede login de novo depois de reiniciar o backend | Esperado quando `JWT_KEY` não está definida (a chave é gerada a cada subida) |

## Documentação

- [`PRD.md`](PRD.md) — o quê e por quê do produto
- [`DESIGN.md`](DESIGN.md) — tokens, componentes e temas do frontend
- [`AGENTS.md`](AGENTS.md) — convenções e regras de segurança do projeto
