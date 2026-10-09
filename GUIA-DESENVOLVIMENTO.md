# Guia de Desenvolvimento — Para quem vem do ASP Clássico

Este documento explica como a stack React + C# + SQL Server funciona, comparando
com o modelo mental do ASP clássico.

## 1. A diferença fundamental de arquitetura

No ASP clássico, uma única página `.asp` fazia tudo: recebia a requisição HTTP,
rodava VBScript, acessava o banco via ADO/Recordset, e devolvia HTML pronto para
o navegador. Cada clique no site geralmente disparava um "postback" — a página
inteira recarregava.

Nesta stack, existem **duas aplicações separadas** que conversam por HTTP,
trocando apenas JSON (nunca HTML):

```
┌─────────────────────┐         HTTP / JSON         ┌──────────────────────┐
│   FRONTEND (React)   │  ───────────────────────►   │   BACKEND (.NET API)  │
│  localhost:5173       │  ◄───────────────────────   │   localhost:5000       │
│  Roda no navegador    │                              │  Roda no servidor      │
└─────────────────────┘                              └──────────┬───────────┘
                                                                   │ EF Core
                                                                   ▼
                                                        ┌──────────────────────┐
                                                        │   SQL Server (db)      │
                                                        │   localhost:1433       │
                                                        └──────────────────────┘
```

O React nunca acessa o banco diretamente — só o backend (.NET) tem essa
permissão. O frontend só sabe conversar com a API via `fetch()`.

## 2. Tabela de comparação

| Conceito ASP Clássico | Equivalente aqui |
|---|---|
| Página `.asp` gera HTML no servidor | React gera a tela **no navegador** (SPA — Single Page Application) |
| `Response.Write("<h1>...</h1>")` | Componente React (`App.tsx`) renderiza JSX |
| `Request.Form("nome")` | Corpo JSON de um `POST` (`{ "nome": "..." }`) |
| ADO / `Recordset` / `rs.Open` | Entity Framework Core / `DbContext` / `DbSet<Item>` |
| `<!--#include file="header.asp"-->` | Componentes React reutilizáveis (`import` de `.tsx`) |
| Postback (recarrega a página inteira) | Chamada `fetch()` em segundo plano — a página não recarrega |
| Sessão fica no IIS | Sem sessão de servidor por padrão; API é "stateless" (sem estado entre requisições) |
| Site publicado no IIS | Duas imagens Docker: uma do backend, uma do frontend |

## 3. Como o CRUD funciona (passo a passo real do projeto)

### Exemplo: usuário clica em "Adicionar" no formulário

1. **`frontend/src/App.tsx`** — o formulário chama `onSubmit`, que chama
   `createItem(nome, descricao)` (importado de `api.ts`).
2. **`frontend/src/api.ts`** — a função `createItem` faz:
   ```ts
   fetch(`${API_URL}/api/items`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ nome, descricao }),
   })
   ```
   Isso é o equivalente moderno de um `Request.Form` — só que quem monta a
   requisição é o próprio navegador (JavaScript), não um formulário HTML puro.
3. **`backend/Program.cs`** — o endpoint recebe:
   ```csharp
   items.MapPost("/", async (Item item, AppDbContext db) =>
   {
       db.Items.Add(item);
       await db.SaveChangesAsync();
       return Results.Created($"/api/items/{item.Id}", item);
   });
   ```
   O ASP.NET já desserializa o JSON recebido direto para um objeto `Item`
   (nada de `Request.Form` manual).
4. **`backend/Data/AppDbContext.cs`** + EF Core traduzem `db.Items.Add(item)`
   em um `INSERT` real no SQL Server — sem você escrever SQL na mão (isso é
   o "ORM": Object-Relational Mapper).
5. O backend devolve o item criado como JSON (`201 Created`).
6. **De volta no `App.tsx`**, após o `createItem` terminar, o código chama
   `carregar()` de novo, que busca a lista atualizada (`listItems()`) e o
   React re-renderiza a tela com o novo item — sem recarregar a página.

### Os outros endpoints seguem o mesmo padrão

| Ação | Frontend (`api.ts`) | Backend (`Program.cs`) | SQL equivalente |
|---|---|---|---|
| Listar | `listItems()` → `GET /api/items` | `db.Items.ToListAsync()` | `SELECT * FROM Items` |
| Criar | `createItem()` → `POST /api/items` | `db.Items.Add(item)` | `INSERT INTO Items ...` |
| Excluir | `deleteItem()` → `DELETE /api/items/{id}` | `db.Items.Remove(item)` | `DELETE FROM Items WHERE Id = ...` |

## 4. Onde mexer no front-end

| Arquivo | Para que serve | Quando mexer |
|---|---|---|
| `frontend/src/App.tsx` | A tela: formulário, lista, botões, lógica de UI | Sempre que mudar o que aparece na página |
| `frontend/src/api.ts` | Funções que chamam a API | Ao adicionar uma nova chamada ao backend, ou mudar a URL/campos |
| `frontend/src/App.css` | Estilo visual | Ao mudar a aparência |
| `frontend/src/main.tsx` | Monta o `<App />` no HTML | Quase nunca |
| `frontend/index.html` | HTML "casca" (só tem uma `<div id="root">`) | Quase nunca (título da aba, meta tags) |
| `frontend/vite.config.ts` | Configuração do servidor de desenvolvimento | Só se mudar porta ou configs avançadas |

Regra prática: **95% do trabalho do dia a dia acontece dentro de `src/App.tsx`**
(e em novos arquivos `.tsx` que você criar para novas telas/componentes).

## 5. Node.js é necessário para rodar React?

- **Em desenvolvimento: sim.** O Vite (ferramenta usada para criar este
  projeto) roda sobre Node.js e serve a aplicação com *hot-reload* — toda vez
  que você salva um arquivo, o navegador atualiza sozinho. É isso que o
  `frontend/Dockerfile.dev` faz.
- **Em produção: não.** Rodando `npm run build`, o React vira um punhado de
  arquivos estáticos (`.html`, `.js`, `.css`) sem nenhuma lógica de servidor.
  Qualquer servidor web estático consegue servir isso — o
  `frontend/Dockerfile` (produção) builda com Node e depois entrega os
  arquivos prontos via **Nginx**, sem Node rodando no container final.

Ou seja: Node.js é uma **ferramenta de build/desenvolvimento**, não um
requisito para a aplicação funcionar depois de pronta — diferente do IIS no
ASP clássico, que precisa estar rodando o tempo todo para servir as páginas.

## 6. Fluxo de trabalho no dia a dia

```bash
docker compose up --build   # sobe tudo (db + backend + frontend)
```

- Editou algo em `frontend/src/*`? O navegador atualiza sozinho (hot-reload),
  não precisa reiniciar nada.
- Editou algo em `backend/*.cs`? Precisa rebuildar o container:
  ```bash
  docker compose up --build backend
  ```
- Mudou o modelo de dados (`Models/Item.cs`)? Gere uma nova migration (veja o
  `README.md` — seção "Desenvolvimento") antes de rebuildar o backend.
