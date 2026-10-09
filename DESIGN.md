# DESIGN.md — Sistema de design (Peex Learning)

Guia visual para manter o frontend React consistente. Complementa `PRD.md`
(o quê construir) e `AGENTS.md` (convenções de código).

## Stack visual

- **Tailwind CSS v4** (via `@tailwindcss/vite`), configurado em
  `frontend/src/index.css` com um bloco `@theme` que declara os tokens do
  projeto como variáveis `--color-*`/`--font-*`/`--animate-*` — Tailwind gera
  as classes utilitárias (`bg-primary`, `text-text-muted`, etc.) a partir
  delas automaticamente. Não há `tailwind.config.js` separado: tudo fica no
  `@theme` do `index.css`.
- **Sem biblioteca de componentes** (Material UI, Ant Design, Chakra, etc.).
  Em vez disso, um punhado de primitivos próprios em
  `frontend/src/components/ui/` (`Button`, `Badge`, `Card`) cobre os padrões
  repetidos — isso mantém tudo explicável linha a linha (importante para a
  apresentação do desafio) sem reescrever classes Tailwind longas em cada
  tela.
- Decisão registrada em 2026-09-14: antes disso o projeto usava CSS próprio
  em `App.css`/classes globais; migrado para Tailwind a pedido do usuário
  para elevar o acabamento visual sem herdar o peso de uma lib de
  componentes completa.

## Princípios

- **Clareza acima de decoração.** O aluno está estudando; a interface não
  compete pela atenção dele.
- **Progresso sempre visível.** Barra/indicador de progresso presente em
  qualquer lugar que mostre uma trilha ou curso.
- **Consistência antes de originalidade.** Reuso dos primitivos de
  `components/ui/` > recriar estilo a cada tela nova.
- **Acessível por padrão.** Contraste AA, foco visível, navegável por
  teclado — não é um "extra", é requisito de toda tela nova.

## Tokens

Declarados em `frontend/src/index.css`, dentro de `@theme` (modo claro) e
redefinidos em `:root[data-tema='escuro']` (modo escuro) — mesmo
nome de variável, valor diferente, então qualquer classe Tailwind que a
referencia (`bg-bg`, `text-text`, `border-border`...) já muda de tema
sozinha.

```css
@theme {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  --color-bg: #ffffff;
  --color-surface: #f4f5f7;
  --color-border: #e2e4e9;
  --color-text: #1a1d23;
  --color-text-muted: #5b6270;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-danger-soft: #fee2e2;

  --color-badge-iniciante-bg / -text
  --color-badge-intermediario-bg / -text
  --color-badge-avancado-bg / -text
}
```

Regra: **nenhuma cor "solta"** em componentes — sempre uma classe Tailwind
que resolve para um destes tokens (`bg-primary`, `text-danger`), nunca um
hex direto (`bg-[#4f46e5]`) ou uma cor Tailwind padrão não mapeada
(`bg-indigo-600`). Isso é o que permite trocar o tema (ou a marca) editando
só o `@theme`.

### Tema claro/escuro

- Seletor Claro · Escuro · Sistema no menu superior (`components/SeletorTema.tsx`), preferência salva em `localStorage` (`src/tema.ts`); padrão: Sistema. Um script em `index.html` aplica `data-tema` antes do React para não piscar.
- Escuro suavizado: grafite azulado (não preto), cards mais claros que o fundo (elevação), texto off-white, bordas discretas.
- `primary` é a cor de **preenchimento** (texto branco por cima); `primary-ink` é a cor de **texto/link** (mais clara no escuro, para manter contraste). Use `text-primary-ink`, nunca `text-primary`.

## Tipografia

- Fonte: **Inter** (Google Fonts, carregada em `index.html`), com fallback
  para a system font stack.
- Escala via classes Tailwind padrão (`text-xs`/`text-sm`/`text-lg`/etc.);
  `h1`/`h2` já têm peso e espaçamento definidos globalmente em
  `index.css` (`@layer base`) — não redeclare tamanho/peso de título em
  cada página.
- Peso: `font-semibold` para títulos e ações, `font-bold`/`font-extrabold`
  só para a marca na navbar — evite `font-black` (visual "gritado").

## Primitivos (`frontend/src/components/ui/`)

### `Button`

- Variantes: `primario` (ação principal, uma por formulário), `secundario`
  (ações auxiliares — adicionar/remover linha, etc.), `perigo` (exclusão,
  sempre com confirmação antes), `link` (ação inline tipo "Sair").
- Sempre `disabled` enquanto a ação estiver em andamento (ver
  `AGENTS.md`/regra de UX de formulários) — o componente já cuida do estilo
  de desabilitado, só falta o app passar a prop.

### `Badge`

- Recebe `nivel` (`Iniciante`/`Intermediario`/`Avancado`) e resolve a cor
  certa dos tokens `--color-badge-*`. Não crie uma badge com cor manual.

### `Card`

- Envolve um `Link` de catálogo (curso/trilha) com o tratamento visual
  padrão (borda, fundo, hover). Não recrie o hover/elevação em CSS solto.

## Componentes-chave (padrões sem primitivo dedicado)

### Barra de progresso (`components/ProgressBar.tsx`)

- Sempre com o valor numérico ao lado (`"3 de 8 aulas"`), nunca só a barra
  visual sozinha — acessibilidade e clareza.
- Cor: `bg-primary` até 99%, `bg-success` ao atingir 100%.

### Toast (`components/ToastProvider.tsx`)

- Único canal de feedback de sucesso/erro para ações que mutam dado —
  nunca uma mensagem inline que exige rolar a página para ver (foi um bug
  real: formulário sem essa proteção gerou registros duplicados porque o
  usuário não via confirmação e clicava de novo).

### Estados

- **Loading:** texto simples ("Carregando...") nesta fase — uma lista de
  skeleton pode vir depois se a superfície de UI crescer.
- **Vazio:** `bg-surface` + texto + call-to-action para o catálogo.
- **Erro:** mensagem clara em `text-danger`, nunca só "Ocorreu um erro".

## Layout

- **Área logada:** `components/AppShell.tsx` — menu superior fixo (mais área útil
  para conteúdo e player). Aluno: Início, Cursos, Meus cursos, Trilhas.
  Admin/Instrutor: Painel, Alunos, Conteúdo. No celular o menu recolhe num
  botão. Todas as rotas logadas ficam aninhadas nele em `App.tsx`.
- **Admin/Instrutor não estudam:** rotas de estudo (`/inicio`, `/cursos`,
  `/meus-cursos`, `/trilhas`) redirecionam para `/admin`; curso, aula e
  trilha abrem em modo pré-visualização (sem progresso, sem quiz).
- **Gráficos do painel:** barras de uma cor (token `primary`), valor na ponta,
  status sempre com ponto + texto, e uma tabela equivalente abaixo (segue
  a skill `dataviz`).
- **Login/Registro:** `components/AuthLayout.tsx` — tela dividida (painel de
  marca + formulário); só o formulário no mobile.
- **Ícones:** `components/ui/Icon.tsx` (SVGs inline, sem dependência nova).
- Largura máxima de conteúdo: `max-w-7xl`, centralizada.
- Grid de cards: `grid-cols-[repeat(auto-fill,minmax(260px,1fr))]` — se
  adapta de 1 a N colunas sem breakpoints manuais para o caso comum.
- Espaçamento: usar a escala padrão do Tailwind (`gap-2`/`gap-3`/`gap-4`/
  `p-4`/`p-5`), não valores arbitrários (`p-[13px]`).

## Acessibilidade (obrigatório, não opcional)

- Contraste mínimo 4.5:1 para texto normal (WCAG AA) — os tokens já foram
  escolhidos respeitando isso; não introduza uma cor nova sem checar.
- Todo elemento interativo tem estado de foco visível (`:focus-visible`
  global em `index.css`, mais `ring-primary` nos inputs) — nunca remova sem
  substituto.
- Botões de ícone (ex: "marcar aula concluída") sempre com `aria-label`.
- Barra de progresso usa `role="progressbar"` com `aria-valuenow`.

## Responsividade

- Mobile-first: estilos base pensados para telas pequenas, prefixos
  `sm:`/`md:`/`lg:` do Tailwind adicionam/reorganizam para telas maiores.

## O que evitar

- Biblioteca de componentes completa (Material UI, Ant Design, Chakra,
  shadcn/ui) — decisão explícita de ficar só com Tailwind + os primitivos
  de `components/ui/`; reavaliar apenas se a superfície de UI crescer muito
  além do escopo do desafio.
- Cor arbitrária (`bg-[#...]`) ou classe de cor padrão do Tailwind não
  mapeada a um token (`bg-indigo-600`, `text-red-500`) — sempre os tokens
  semânticos do `@theme`.
- Animações decorativas sem função (elas atrasam a percepção de velocidade
  sem ajudar o aluno a entender o que aconteceu).
- Texto em maiúsculas para ênfase (prejudica leitura e acessibilidade) —
  usar peso de fonte ou cor.
