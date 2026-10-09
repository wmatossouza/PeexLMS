# Popula o ambiente de DESENVOLVIMENTO com trilhas, cursos, aulas, quizzes e alunos de demonstração.
# Idempotente: o que já existe (pelo título/email) é reaproveitado, não duplicado.
# Uso:  powershell -ExecutionPolicy Bypass -File scripts/seed.ps1
param(
    [string]$Api = 'http://localhost:5000',
    [string]$AdminEmail = 'admin@demo.com',
    [string]$AdminSenha = 'Demo@12345'
)

$ErrorActionPreference = 'Stop'
$SenhaDemo = 'Demo@12345'

function Chamar($Metodo, $Caminho, $Corpo = $null, $Token = $null) {
    $h = @{}
    if ($Token) { $h['Authorization'] = "Bearer $Token" }
    $req = @{ Method = $Metodo; Uri = "$Api$Caminho"; Headers = $h; ContentType = 'application/json; charset=utf-8' }
    if ($null -ne $Corpo) { $req['Body'] = [Text.Encoding]::UTF8.GetBytes(($Corpo | ConvertTo-Json -Depth 10)) }
    Invoke-RestMethod @req
}

function Entrar($Email, $Senha) { (Chamar 'POST' '/api/auth/login' @{ email = $Email; senha = $Senha }).accessToken }

# Em um banco novo não existe administrador: cria um e promove (substitui o papel Aluno por Admin).
function GarantirAdmin {
    try { return Entrar $AdminEmail $AdminSenha } catch { }

    Write-Host "Criando administrador de demonstração ($AdminEmail)..."
    try { Chamar 'POST' '/api/auth/registrar' @{ nome = 'Administrador Demo'; email = $AdminEmail; senha = $AdminSenha } | Out-Null }
    catch { throw "Não foi possível criar o administrador. O email $AdminEmail já existe com outra senha?" }

    $pw = $env:MSSQL_SA_PASSWORD
    $arqEnv = Join-Path $PSScriptRoot '..\.env'
    if (-not $pw -and (Test-Path $arqEnv)) {
        $linha = Get-Content $arqEnv | Where-Object { $_ -match '^MSSQL_SA_PASSWORD=' } | Select-Object -First 1
        if ($linha) { $pw = ($linha -replace '^MSSQL_SA_PASSWORD=', '').Trim() }
    }
    if (-not $pw) { throw 'Defina MSSQL_SA_PASSWORD (ou crie o arquivo .env) para promover o administrador.' }

    $email = $AdminEmail.Replace("'", "''")
    $sql = "DELETE ur FROM AspNetUserRoles ur JOIN AspNetUsers u ON u.Id = ur.UserId WHERE u.Email = '$email'; INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT u.Id, r.Id FROM AspNetUsers u, AspNetRoles r WHERE u.Email = '$email' AND r.Name = 'Admin';"
    docker exec peex-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $pw -C -d PeexDb -Q $sql | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao promover o administrador no banco (o container peex-db está rodando?).' }
    Entrar $AdminEmail $AdminSenha
}
function CriarQuiz($CursoId, $Curso, $Token) {
    # um único (pergunta, opções, correta) chega "achatado" pelo PowerShell: reembrulha
    $qs = New-Object System.Collections.ArrayList
    if ($Curso.q[0] -is [string]) { [void]$qs.Add($Curso.q) } else { foreach ($x in $Curso.q) { [void]$qs.Add($x) } }
    $perguntas = @(); $ord = 1
    foreach ($q in $qs) {
        $opcoes = @(); for ($i = 0; $i -lt $q[1].Count; $i++) { $opcoes += @{ texto = $q[1][$i]; correta = ($i -eq $q[2]) } }
        $perguntas += @{ enunciado = $q[0]; ordem = $ord; opcoes = $opcoes }; $ord++
    }
    Chamar 'POST' "/api/cursos/$CursoId/quiz" @{ titulo = "Quiz - $($Curso.t)"; perguntas = $perguntas } $Token | Out-Null
}
. "$PSScriptRoot\seed-conteudo.ps1"

# --- Catálogo -----------------------------------------------------------------
# Aula: @(titulo, tipo, minutos).  Quiz: @(pergunta, @(opcoes...), indiceDaCorreta)
$Cursos = @(
    @{ t = 'Curso de Demonstração Completo'; n = 'Iniciante'; d = 'Curso de teste com vídeos, textos de estudo, navegação entre aulas e quiz final.'
       a = @(
         @('Boas-vindas ao curso', 'Video', 3, $Videos[0], $DemoT1),
         @('Conceitos fundamentais', 'Texto', 8, 'https://exemplo.peex.dev/texto', $DemoT2),
         @('Demonstração prática', 'Video', 5, $Videos[1], $DemoT3),
         @('Boas práticas e checklist', 'Texto', 6, 'https://exemplo.peex.dev/texto', $DemoT4),
         @('Aula completa em vídeo', 'Video', 12, $Videos[2], $DemoT5),
         @('Resumo e próximos passos', 'Texto', 4, 'https://exemplo.peex.dev/texto', $DemoT6))
       q = @(@('Quais são os três pilares citados na aula de conceitos?', @('Contexto, prática e revisão', 'Pressa, sorte e atalhos', 'Vídeo, texto e imagem'), 0),
             @('Para registrar o progresso numa aula, você deve…', @('Concluir a aula', 'Fechar o navegador', 'Apagar o curso'), 0),
             @('A revisão espaçada serve para…', @('Fixar o aprendizado por mais tempo', 'Gastar tempo', 'Evitar praticar'), 0)) },
    @{ t = 'TypeScript Essencial'; n = 'Iniciante'; d = 'Tipos, interfaces e generics para escrever JavaScript com segurança.'
       a = @(@('Por que TypeScript?', 'Video', 8), @('Tipos básicos e inferência', 'Video', 14), @('Interfaces e type aliases', 'Texto', 10), @('Generics na prática', 'Video', 18), @('Configurando o tsconfig', 'Texto', 7))
       q = @(@('Qual palavra-chave define um contrato de objeto?', @('interface', 'loop', 'import'), 0), @('TypeScript é compilado para…', @('Java', 'JavaScript', 'C#'), 1)) },
    @{ t = 'Tailwind CSS na Prática'; n = 'Iniciante'; d = 'Construa interfaces modernas e responsivas com classes utilitárias.'
       a = @(@('Utility-first: a ideia', 'Video', 9), @('Espaçamento, cores e tipografia', 'Video', 15), @('Layout com flex e grid', 'Video', 20), @('Dark mode e tokens de tema', 'Texto', 12))
       q = @(@('Tailwind é baseado em…', @('Classes utilitárias', 'Componentes prontos', 'Tabelas'), 0)) },
    @{ t = 'React Avançado'; n = 'Avancado'; d = 'Performance, padrões de composição e gerenciamento de estado em apps grandes.'
       a = @(@('Renderização e reconciliação', 'Video', 22), @('useMemo, useCallback e quando evitar', 'Video', 16), @('Composição vs. herança', 'Texto', 11), @('Context API em escala', 'Video', 19), @('Code splitting e lazy loading', 'Video', 17), @('Testes de componentes', 'Texto', 14))
       q = @(@('Qual hook memoriza um valor calculado?', @('useMemo', 'useRef', 'useId'), 0), @('Lazy loading ajuda a…', @('Reduzir o bundle inicial', 'Aumentar o bundle', 'Remover o React'), 0)) },
    @{ t = 'C# do Zero'; n = 'Iniciante'; d = 'Sintaxe, tipos, coleções e orientação a objetos com C# moderno.'
       a = @(@('Instalando o .NET e primeiro programa', 'Video', 10), @('Variáveis, tipos e operadores', 'Video', 15), @('Coleções e LINQ básico', 'Video', 21), @('Classes, records e herança', 'Texto', 13), @('Async e await', 'Video', 18))
       q = @(@('Qual tipo representa um registro imutável em C#?', @('record', 'goto', 'delegate'), 0), @('LINQ serve para…', @('Consultar coleções', 'Desenhar telas', 'Compilar CSS'), 0)) },
    @{ t = 'APIs com .NET 8 Minimal APIs'; n = 'Intermediario'; d = 'Crie endpoints enxutos, com validação, autenticação JWT e documentação Swagger.'
       a = @(@('Estrutura de uma Minimal API', 'Video', 12), @('MapGroup e organização por recurso', 'Video', 14), @('Validação de entrada', 'Texto', 9), @('Autenticação JWT', 'Video', 24), @('Swagger e versionamento', 'Texto', 8))
       q = @(@('Qual método agrupa endpoints sob um prefixo?', @('MapGroup', 'MapAll', 'MapBlock'), 0), @('JWT significa…', @('JSON Web Token', 'Java Web Tool', 'JS Wire Type'), 0)) },
    @{ t = 'Entity Framework Core'; n = 'Intermediario'; d = 'Modelagem, migrations, relacionamentos e consultas eficientes com EF Core.'
       a = @(@('DbContext e entidades', 'Video', 13), @('Migrations no dia a dia', 'Video', 16), @('Relacionamentos 1:N e N:N', 'Video', 20), @('Consultas e Include', 'Texto', 11), @('Evitando o problema N+1', 'Video', 15))
       q = @(@('Qual comando cria uma migration?', @('dotnet ef migrations add', 'dotnet new', 'dotnet run'), 0)) },
    @{ t = 'SQL Server para Devs'; n = 'Intermediario'; d = 'Índices, planos de execução e boas práticas de consulta para desenvolvedores.'
       a = @(@('Modelo relacional em 15 minutos', 'Video', 15), @('Índices: quando e por quê', 'Video', 19), @('Lendo planos de execução', 'Video', 22), @('Transações e isolamento', 'Texto', 12))
       q = @(@('Índices servem principalmente para…', @('Acelerar leituras', 'Apagar dados', 'Criptografar tabelas'), 0)) },
    @{ t = 'Engenharia de Prompts'; n = 'Iniciante'; d = 'Aprenda a pedir o que precisa para a IA: contexto, exemplos e critérios claros.'
       a = @(@('Anatomia de um bom prompt', 'Video', 11), @('Contexto, papel e formato', 'Texto', 8), @('Few-shot: ensinando por exemplos', 'Video', 14), @('Iterando e avaliando respostas', 'Video', 13))
       q = @(@('O que melhora a qualidade de um prompt?', @('Contexto e exemplos', 'Ser vago', 'Usar só uma palavra'), 0)) },
    @{ t = 'IA no Dia a Dia'; n = 'Iniciante'; d = 'Use assistentes de IA para escrever, resumir, analisar e automatizar tarefas.'
       a = @(@('O que a IA faz bem (e mal)', 'Video', 10), @('Resumos e análises rápidas', 'Video', 12), @('Automatizando tarefas repetitivas', 'Texto', 9))
       q = @(@('Devemos revisar o que a IA gera?', @('Sempre', 'Nunca', 'Só às sextas'), 0)) },
    @{ t = 'Comunicação Eficaz'; n = 'Iniciante'; d = 'Escuta ativa, clareza e assertividade para o trabalho em equipe.'
       a = @(@('Escuta ativa', 'Video', 9), @('Mensagens claras e objetivas', 'Texto', 7), @('Comunicação assíncrona', 'Video', 12), @('Conversas difíceis', 'Video', 16))
       q = @(@('Escuta ativa significa…', @('Entender antes de responder', 'Interromper', 'Olhar o celular'), 0)) },
    @{ t = 'Gestão do Tempo'; n = 'Iniciante'; d = 'Priorização, foco e rotina para entregar mais com menos estresse.'
       a = @(@('Matriz de Eisenhower', 'Video', 8), @('Blocos de foco', 'Video', 10), @('Lidando com interrupções', 'Texto', 7))
       q = @(@('Priorizar é…', @('Decidir o que fazer primeiro', 'Fazer tudo ao mesmo tempo', 'Adiar sempre'), 0)) },
    @{ t = 'Feedback e Liderança'; n = 'Avancado'; d = 'Dê e receba feedback de forma construtiva e desenvolva pessoas.'
       a = @(@('Modelo SBI de feedback', 'Video', 12), @('Feedback difícil sem conflito', 'Video', 18), @('1:1 que realmente funciona', 'Texto', 10), @('Desenvolvendo autonomia no time', 'Video', 20))
       q = @(@('No modelo SBI, o "B" significa…', @('Behavior (comportamento)', 'Budget', 'Backlog'), 0)) }
)

# Ordem dos cursos dentro de cada trilha (títulos já existentes no banco também valem)
$Trilhas = @(
    @{ t = 'Formação React'; n = 'Iniciante'; c = 'Frontend'; d = 'Do zero ao avançado'
       cursos = @('React Básico', 'TypeScript Essencial', 'Tailwind CSS na Prática', 'React Avançado') },
    @{ t = 'Formação IA'; n = 'Intermediario'; c = 'Desenvolvimento'; d = 'IA'
       cursos = @('Claude Code', 'Engenharia de Prompts', 'IA no Dia a Dia') },
    @{ t = 'Backend com .NET'; n = 'Intermediario'; c = 'Backend'; d = 'Construa APIs profissionais com C#, .NET 8, EF Core e SQL Server.'
       cursos = @('C# do Zero', 'APIs com .NET 8 Minimal APIs', 'Entity Framework Core', 'SQL Server para Devs') },
    @{ t = 'Soft Skills para Times'; n = 'Iniciante'; c = 'Carreira'; d = 'Comunicação, organização e liderança para crescer na carreira.'
       cursos = @('Comunicação Eficaz', 'Gestão do Tempo', 'Feedback e Liderança') }
)

Write-Host 'Autenticando como admin...'
$tk = GarantirAdmin

$existentes = @{}
foreach ($c in (Chamar 'GET' '/api/cursos')) { $existentes[$c.titulo] = $c.id }

foreach ($c in $Cursos) {
    if ($existentes.ContainsKey($c.t)) {
        $cid = $existentes[$c.t]
        try { Chamar 'GET' "/api/cursos/$cid/quiz" $null $tk | Out-Null; Write-Host "= curso existe: $($c.t)" }
        catch { CriarQuiz $cid $c $tk; Write-Host "+ quiz adicionado: $($c.t)" }
        continue
    }
    $novo = Chamar 'POST' '/api/cursos' @{ titulo = $c.t; descricao = $c.d; nivel = $c.n } $tk
    $existentes[$c.t] = $novo.id
    $ordem = 1
    foreach ($a in $c.a) {
        $slug = ($a[0].ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
        $url = if ($a.Count -gt 3) { $a[3] } else { "https://exemplo.peex.dev/aulas/$slug" }
        $corpo = @{ titulo = $a[0]; tipoConteudo = $a[1]; urlConteudo = $url; ordem = $ordem; duracaoMinutos = $a[2] }
        if ($a.Count -gt 4) { $corpo['conteudo'] = $a[4] }
        Chamar 'POST' "/api/cursos/$($novo.id)/aulas" $corpo $tk | Out-Null
        $ordem++
    }
    CriarQuiz $novo.id $c $tk
    Write-Host "+ curso criado: $($c.t) ($($c.a.Count) aulas)"
}

$trilhasExistentes = @{}
foreach ($t in (Chamar 'GET' '/api/trilhas')) { $trilhasExistentes[$t.titulo] = $t }

foreach ($t in $Trilhas) {
    if ($trilhasExistentes.ContainsKey($t.t)) { $tr = $trilhasExistentes[$t.t]; Write-Host "= trilha existe: $($t.t)" }
    else {
        $tr = Chamar 'POST' '/api/trilhas' @{ titulo = $t.t; descricao = $t.d; nivel = $t.n; categoria = $t.c } $tk
        $tr | Add-Member -NotePropertyName cursos -NotePropertyValue @() -Force
        Write-Host "+ trilha criada: $($t.t)"
    }
    $jaNaTrilha = @($tr.cursos | ForEach-Object { $_.id })
    $ordem = 1
    foreach ($titulo in $t.cursos) {
        $id = $existentes[$titulo]
        if ($id -and ($jaNaTrilha -notcontains $id)) {
            Chamar 'POST' "/api/trilhas/$($tr.id)/cursos" @{ cursoId = $id; ordem = $ordem } $tk | Out-Null
            Write-Host "    + $titulo -> $($t.t)"
        }
        $ordem++
    }
}

# --- Conteúdo das aulas (idempotente: só preenche aulas que ainda não têm texto) ---
$catalogo = Chamar 'GET' '/api/cursos'
foreach ($cat in $catalogo) {
    $det = Chamar 'GET' "/api/cursos/$($cat.id)" $null $tk
    foreach ($au in $det.aulas) {
        if ($au.conteudo) { continue }
        $ehVideo = ($au.tipoConteudo -eq 'Video')
        $url = $au.urlConteudo
        if ($ehVideo -and $url -notmatch '\.(mp4|webm)$') { $url = $Videos[$au.id % $Videos.Count] }
        Chamar 'PUT' "/api/aulas/$($au.id)" @{
            titulo = $au.titulo; tipoConteudo = $au.tipoConteudo; urlConteudo = $url; ordem = $au.ordem
            duracaoMinutos = $au.duracaoMinutos; conteudo = (TextoGenerico $cat.titulo $au.titulo $cat.descricao $ehVideo)
        } $tk | Out-Null
    }
    Write-Host "~ conteúdo das aulas: $($cat.titulo)"
}
# --- Alunos de demonstração e progresso ----------------------------------------
# aluno -> lista de (curso, quantas aulas concluir (-1 = todas), responder quiz?, acerta?)
$Alunos = @(
    @{ n = 'Ana Souza'; e = 'ana@demo.com'; p = @(@('React Básico', -1, $true, $true), @('TypeScript Essencial', 3, $false, $false), @('Tailwind CSS na Prática', 1, $false, $false)) },
    @{ n = 'Bruno Lima'; e = 'bruno@demo.com'; p = @(@('C# do Zero', -1, $true, $true), @('APIs com .NET 8 Minimal APIs', 2, $false, $false)) },
    @{ n = 'Carla Mendes'; e = 'carla@demo.com'; p = @(@('Engenharia de Prompts', -1, $true, $false), @('IA no Dia a Dia', -1, $true, $true), @('Claude Code', 1, $false, $false)) },
    @{ n = 'Diego Alves'; e = 'diego@demo.com'; p = @(@('Comunicação Eficaz', 2, $false, $false), @('Gestão do Tempo', -1, $true, $true)) },
    @{ n = 'Elisa Rocha'; e = 'elisa@demo.com'; p = @(@('Entity Framework Core', 4, $false, $false), @('SQL Server para Devs', 1, $false, $false), @('React Avançado', 2, $false, $false)) }
)

foreach ($al in $Alunos) {
    try { Chamar 'POST' '/api/auth/registrar' @{ nome = $al.n; email = $al.e; senha = $SenhaDemo } | Out-Null; Write-Host "+ aluno: $($al.n)" }
    catch { Write-Host "= aluno existe: $($al.n)" }
    $ta = Entrar $al.e $SenhaDemo
    foreach ($p in $al.p) {
        $cid = $existentes[$p[0]]; if (-not $cid) { continue }
        $curso = Chamar 'GET' "/api/cursos/$cid" $null $ta
        $aulas = @($curso.aulas | Sort-Object ordem)
        $qtd = if ($p[1] -lt 0) { $aulas.Count } else { [Math]::Min($p[1], $aulas.Count) }
        for ($i = 0; $i -lt $qtd; $i++) { Chamar 'POST' "/api/progresso/aulas/$($aulas[$i].id)/concluir" $null $ta | Out-Null }
        if ($p[2]) {
            $quiz = Chamar 'GET' "/api/cursos/$cid/quiz/responder" $null $ta
            $respostas = @()
            foreach ($perg in $quiz.perguntas) {
                $ops = @($perg.opcoes | Sort-Object id)
                $escolha = if ($p[3]) { $ops[0] } else { $ops[$ops.Count - 1] }  # a correta é sempre a 1ª opção cadastrada
                $respostas += @{ quizPerguntaId = $perg.id; quizOpcaoId = $escolha.id }
            }
            Chamar 'POST' "/api/quiz/$($quiz.id)/responder" @{ respostas = $respostas } $ta | Out-Null
        }
    }
}

Write-Host "`nPronto. Alunos de demo: ana|bruno|carla|diego|elisa @demo.com  senha: $SenhaDemo"
