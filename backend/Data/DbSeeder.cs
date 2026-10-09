using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Peex.Api.Models;

namespace Peex.Api.Data;

// Dados de demonstração para DESENVOLVIMENTO (ligado por Seed:Demo=true, só em Development).
// Idempotente: o que já existe (pelo título/email) é reaproveitado, nunca duplicado.
public static class DbSeeder
{
    private const string SenhaDemo = "Demo@12345";
    private const string EmailAdmin = "admin@demo.com";

    // Vídeos públicos de exemplo (licença livre), usados em rodízio nas aulas em vídeo.
    private static readonly string[] Videos =
    [
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
        "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
    ];

    // Na definição, a PRIMEIRA opção é a correta; o seeder a posiciona de forma variada.
    private record PerguntaDef(string Enunciado, params string[] Opcoes);
    private record AulaDef(string Titulo, TipoConteudo Tipo, int Minutos, string? Url = null, string? Texto = null);
    private record CursoDef(string Titulo, Nivel Nivel, string Descricao, AulaDef[] Aulas, PerguntaDef[] Quiz);
    private record TrilhaDef(string Titulo, string Descricao, Nivel Nivel, string Categoria, string[] Cursos);
    // Aulas = -1 conclui todas.
    private record ProgressoDef(string Curso, int Aulas, bool ResponderQuiz = false, bool Acertar = true);
    private record AlunoDef(string Nome, string Email, int DiasAtras, ProgressoDef[] Progresso);

    private static AulaDef V(string titulo, int min) => new(titulo, TipoConteudo.Video, min);
    private static AulaDef T(string titulo, int min) => new(titulo, TipoConteudo.Texto, min);

    public static async Task SeedDemoAsync(IServiceProvider servicos)
    {
        var db = servicos.GetRequiredService<AppDbContext>();
        var usuarios = servicos.GetRequiredService<UserManager<Usuario>>();
        var logger = servicos.GetRequiredService<ILoggerFactory>().CreateLogger("Seed");

        await GarantirUsuarioAsync(usuarios, "Administrador Demo", EmailAdmin, "Admin");
        await CriarCursosAsync(db);
        await CriarTrilhasAsync(db);
        await CriarAlunosAsync(db, usuarios);

        logger.LogInformation("Dados de demonstração prontos (admin: {Email} / aluno: ana@demo.com, senha {Senha}).", EmailAdmin, SenhaDemo);
    }

    private static async Task<Usuario?> GarantirUsuarioAsync(UserManager<Usuario> usuarios, string nome, string email, string papel)
    {
        if (await usuarios.FindByEmailAsync(email) is not null) return null;

        var usuario = new Usuario { UserName = email, Email = email, Nome = nome };
        var criado = await usuarios.CreateAsync(usuario, SenhaDemo);
        if (!criado.Succeeded) return null;

        await usuarios.AddToRoleAsync(usuario, papel);
        return usuario;
    }

    private static async Task CriarCursosAsync(AppDbContext db)
    {
        var existentes = (await db.Cursos.Select(c => c.Titulo).ToListAsync()).ToHashSet();
        var videoIdx = 0;
        var posCorreta = 0;

        foreach (var def in Cursos.Where(c => !existentes.Contains(c.Titulo)))
        {
            var curso = new Curso { Titulo = def.Titulo, Descricao = def.Descricao, Nivel = def.Nivel };

            var ordem = 1;
            foreach (var a in def.Aulas)
            {
                var ehVideo = a.Tipo == TipoConteudo.Video;
                curso.Aulas.Add(new Aula
                {
                    Titulo = a.Titulo,
                    TipoConteudo = a.Tipo,
                    UrlConteudo = a.Url ?? (ehVideo ? Videos[videoIdx++ % Videos.Length] : "https://exemplo.peex.dev/texto"),
                    Ordem = ordem++,
                    DuracaoMinutos = a.Minutos,
                    Conteudo = a.Texto ?? TextoGenerico(def.Titulo, a.Titulo, def.Descricao, ehVideo),
                });
            }

            var quiz = new Quiz { Curso = curso, Titulo = $"Quiz - {def.Titulo}" };
            var ordemPergunta = 1;
            foreach (var p in def.Quiz)
            {
                var opcoes = p.Opcoes.Skip(1).Select(t => new QuizOpcao { Texto = t }).ToList();
                var correta = new QuizOpcao { Texto = p.Opcoes[0], Correta = true };
                opcoes.Insert(posCorreta++ % (opcoes.Count + 1), correta);
                quiz.Perguntas.Add(new QuizPergunta { Enunciado = p.Enunciado, Ordem = ordemPergunta++, Opcoes = opcoes });
            }

            db.Cursos.Add(curso);
            db.Quizzes.Add(quiz);
        }

        await db.SaveChangesAsync();
    }

    private static async Task CriarTrilhasAsync(AppDbContext db)
    {
        var cursosPorTitulo = await db.Cursos.ToDictionaryAsync(c => c.Titulo, c => c.Id);

        foreach (var def in Trilhas)
        {
            var trilha = await db.Trilhas.Include(t => t.TrilhaCursos).FirstOrDefaultAsync(t => t.Titulo == def.Titulo);
            if (trilha is null)
            {
                trilha = new Trilha { Titulo = def.Titulo, Descricao = def.Descricao, Nivel = def.Nivel, Categoria = def.Categoria };
                db.Trilhas.Add(trilha);
            }

            var ordem = 1;
            foreach (var titulo in def.Cursos)
            {
                if (cursosPorTitulo.TryGetValue(titulo, out var cursoId) && trilha.TrilhaCursos.All(tc => tc.CursoId != cursoId))
                    trilha.TrilhaCursos.Add(new TrilhaCurso { CursoId = cursoId, Ordem = ordem });
                ordem++;
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task CriarAlunosAsync(AppDbContext db, UserManager<Usuario> usuarios)
    {
        var agora = DateTime.UtcNow;

        foreach (var def in Alunos)
        {
            var aluno = await GarantirUsuarioAsync(usuarios, def.Nome, def.Email, "Aluno");
            if (aluno is null) continue; // já existia: não mexe no progresso

            foreach (var p in def.Progresso)
            {
                var curso = await db.Cursos.Include(c => c.Aulas).FirstOrDefaultAsync(c => c.Titulo == p.Curso);
                if (curso is null) continue;

                var aulas = curso.Aulas.OrderBy(a => a.Ordem).ToList();
                var qtd = p.Aulas < 0 ? aulas.Count : Math.Min(p.Aulas, aulas.Count);
                for (var i = 0; i < qtd; i++)
                {
                    db.ProgressoAulas.Add(new ProgressoAula
                    {
                        UsuarioId = aluno.Id,
                        AulaId = aulas[i].Id,
                        ConcluidoEm = agora.AddDays(-(def.DiasAtras + i % 3)).AddHours(-i),
                    });
                }

                if (!p.ResponderQuiz) continue;
                var quiz = await db.Quizzes.Include(q => q.Perguntas).FirstOrDefaultAsync(q => q.CursoId == curso.Id);
                if (quiz is null) continue;

                var total = quiz.Perguntas.Count;
                db.QuizRespostas.Add(new QuizResposta
                {
                    UsuarioId = aluno.Id,
                    QuizId = quiz.Id,
                    Total = total,
                    Acertos = p.Acertar ? total : 0,
                    RespondidoEm = agora.AddDays(-def.DiasAtras),
                });
            }
        }

        await db.SaveChangesAsync();
    }

    private static string TextoGenerico(string curso, string titulo, string descricao, bool ehVideo)
    {
        var abertura = ehVideo ? "Assista ao vídeo acima e use estas anotações para acompanhar." : "Leia com calma e anote suas dúvidas.";
        return $"""
            ## Objetivo da aula
            {abertura} Nesta aula você vai entender **{titulo}** dentro do curso {curso}. {descricao}

            ## Pontos principais
            - Entenda o conceito e para que ele serve
            - Veja exemplos de uso no dia a dia
            - Identifique erros comuns e como evitá-los

            ## Para fixar
            Depois de estudar, explique o tema com suas palavras e aplique em um pequeno exercício. Quando terminar, marque a aula como concluída para acompanhar seu progresso.
            """;
    }

    private static readonly CursoDef[] Cursos =
    [
        new("Curso de Demonstração Completo", Nivel.Iniciante,
            "Curso de teste com vídeos, textos de estudo, navegação entre aulas e quiz final.",
            [
                new("Boas-vindas ao curso", TipoConteudo.Video, 3, Videos[0], """
                    ## Bem-vindo ao curso de demonstração
                    Este curso existe para você **ver a plataforma completa**: aulas em vídeo, aulas em texto, navegação entre aulas, progresso e quiz final.

                    ## Como o curso funciona
                    - As aulas são feitas em ordem, mas você pode abrir qualquer uma pela lista ao lado
                    - Ao terminar, clique em **Concluir e continuar** para registrar o progresso
                    - No final há um quiz para fixar o conteúdo
                    """),
                new("Conceitos fundamentais", TipoConteudo.Texto, 8, null, """
                    ## Conceitos fundamentais
                    Aprender bem exige três coisas: **contexto**, **prática** e **revisão**. Esta aula resume cada uma delas.

                    ## Contexto
                    Antes de executar, entenda o problema que está resolvendo. Perguntas úteis:
                    - Quem vai usar o resultado?
                    - Qual é o critério de sucesso?
                    - O que acontece se eu não fizer?

                    ## Prática
                    Pratique em pequenos ciclos. Um exemplo de ciclo em pseudocódigo:

                    ```
                    para cada tópico do curso:
                        estudar(tópico)
                        praticar(tópico)
                        revisar(tópico)
                    ```

                    ## Revisão
                    Volte ao conteúdo depois de alguns dias. A revisão espaçada fixa o aprendizado por mais tempo do que estudar tudo de uma vez.
                    """),
                new("Demonstração prática", TipoConteudo.Video, 5, Videos[1], """
                    ## Demonstração prática
                    O vídeo acima é uma demonstração curta. Enquanto assiste, observe o ritmo, os pontos de atenção e como cada etapa se conecta à próxima.

                    ## O que observar
                    - A sequência de etapas
                    - Onde costumam acontecer os erros
                    - Como validar o resultado ao final

                    ## Exercício
                    Pause o vídeo e descreva, com suas palavras, o que acabou de ver. Se conseguir explicar, você entendeu.
                    """),
                new("Boas práticas e checklist", TipoConteudo.Texto, 6, null, """
                    ## Boas práticas e checklist
                    Use esta lista antes de dar uma tarefa por concluída:
                    - O objetivo foi atingido e eu consigo demonstrar isso
                    - Revisei o resultado com olhar crítico
                    - Documentei o que mudou e por quê
                    - Pedi feedback a alguém do time

                    ## Erros comuns
                    - Pular a etapa de revisão por pressa
                    - Aprender só assistindo, sem praticar
                    - Não registrar dúvidas para depois

                    ## Exemplo de registro de estudo
                    ```
                    Tema: Conceitos fundamentais
                    Aprendi: contexto, prática e revisão
                    Dúvida: como medir se aprendi?
                    Próximo passo: refazer o exercício amanhã
                    ```
                    """),
                new("Aula completa em vídeo", TipoConteudo.Video, 12, Videos[2], """
                    ## Aula completa
                    Este é um vídeo mais longo, para você testar o player com pausa, avanço e tela cheia. Use as anotações abaixo para acompanhar.

                    ## Roteiro sugerido
                    - Primeiros minutos: apresentação do tema
                    - Meio: desenvolvimento e exemplos
                    - Final: fechamento e conclusões

                    Dica: pause sempre que quiser anotar algo importante.
                    """),
                new("Resumo e próximos passos", TipoConteudo.Texto, 4, null, """
                    ## Resumo e próximos passos
                    Você passou por vídeos, textos e exercícios. Para consolidar:
                    - **Contexto** vem antes da execução
                    - **Prática** em ciclos curtos fixa o aprendizado
                    - **Revisão** espaçada evita o esquecimento

                    ## E agora?
                    Conclua esta aula e responda ao **quiz final** na página do curso. Depois, explore as trilhas para continuar sua jornada.
                    """),
            ],
            [
                new("Quais são os três pilares citados na aula de conceitos?", "Contexto, prática e revisão", "Pressa, sorte e atalhos", "Vídeo, texto e imagem"),
                new("Para registrar o progresso numa aula, você deve…", "Concluir a aula", "Fechar o navegador", "Apagar o curso"),
                new("A revisão espaçada serve para…", "Fixar o aprendizado por mais tempo", "Gastar tempo", "Evitar praticar"),
            ]),

        new("React Básico", Nivel.Iniciante, "Fundamentos de React: componentes, props, estado e eventos.",
            [V("O que é React?", 9), V("Componentes e props", 14), T("Estado com useState", 10)],
            [new("O que um componente React retorna?", "JSX", "SQL", "Um arquivo CSS"),
             new("Qual hook guarda estado local?", "useState", "useRoute", "useQuery")]),

        new("Claude Code", Nivel.Iniciante, "Programação assistida com Claude Code: planejar, gerar, revisar e corrigir código.",
            [V("Primeiros passos com o Claude Code", 11), T("Escrevendo bons pedidos", 8), V("Revisando o código gerado", 13)],
            [new("O que melhora um pedido ao assistente de código?", "Contexto e critérios claros", "Ser vago", "Usar uma palavra só")]),

        new("TypeScript Essencial", Nivel.Iniciante, "Tipos, interfaces e generics para escrever JavaScript com segurança.",
            [V("Por que TypeScript?", 8), V("Tipos básicos e inferência", 14), T("Interfaces e type aliases", 10), V("Generics na prática", 18), T("Configurando o tsconfig", 7)],
            [new("Qual palavra-chave define um contrato de objeto?", "interface", "loop", "import"),
             new("TypeScript é compilado para…", "JavaScript", "Java", "C#")]),

        new("Tailwind CSS na Prática", Nivel.Iniciante, "Construa interfaces modernas e responsivas com classes utilitárias.",
            [V("Utility-first: a ideia", 9), V("Espaçamento, cores e tipografia", 15), V("Layout com flex e grid", 20), T("Dark mode e tokens de tema", 12)],
            [new("Tailwind é baseado em…", "Classes utilitárias", "Componentes prontos", "Tabelas")]),

        new("React Avançado", Nivel.Avancado, "Performance, padrões de composição e gerenciamento de estado em apps grandes.",
            [V("Renderização e reconciliação", 22), V("useMemo, useCallback e quando evitar", 16), T("Composição vs. herança", 11), V("Context API em escala", 19), V("Code splitting e lazy loading", 17), T("Testes de componentes", 14)],
            [new("Qual hook memoriza um valor calculado?", "useMemo", "useRef", "useId"),
             new("Lazy loading ajuda a…", "Reduzir o bundle inicial", "Aumentar o bundle", "Remover o React")]),

        new("C# do Zero", Nivel.Iniciante, "Sintaxe, tipos, coleções e orientação a objetos com C# moderno.",
            [V("Instalando o .NET e primeiro programa", 10), V("Variáveis, tipos e operadores", 15), V("Coleções e LINQ básico", 21), T("Classes, records e herança", 13), V("Async e await", 18)],
            [new("Qual tipo representa um registro imutável em C#?", "record", "goto", "delegate"),
             new("LINQ serve para…", "Consultar coleções", "Desenhar telas", "Compilar CSS")]),

        new("APIs com .NET 8 Minimal APIs", Nivel.Intermediario, "Crie endpoints enxutos, com validação, autenticação JWT e documentação Swagger.",
            [V("Estrutura de uma Minimal API", 12), V("MapGroup e organização por recurso", 14), T("Validação de entrada", 9), V("Autenticação JWT", 24), T("Swagger e versionamento", 8)],
            [new("Qual método agrupa endpoints sob um prefixo?", "MapGroup", "MapAll", "MapBlock"),
             new("JWT significa…", "JSON Web Token", "Java Web Tool", "JS Wire Type")]),

        new("Entity Framework Core", Nivel.Intermediario, "Modelagem, migrations, relacionamentos e consultas eficientes com EF Core.",
            [V("DbContext e entidades", 13), V("Migrations no dia a dia", 16), V("Relacionamentos 1:N e N:N", 20), T("Consultas e Include", 11), V("Evitando o problema N+1", 15)],
            [new("Qual comando cria uma migration?", "dotnet ef migrations add", "dotnet new", "dotnet run")]),

        new("SQL Server para Devs", Nivel.Intermediario, "Índices, planos de execução e boas práticas de consulta para desenvolvedores.",
            [V("Modelo relacional em 15 minutos", 15), V("Índices: quando e por quê", 19), V("Lendo planos de execução", 22), T("Transações e isolamento", 12)],
            [new("Índices servem principalmente para…", "Acelerar leituras", "Apagar dados", "Criptografar tabelas")]),

        new("Engenharia de Prompts", Nivel.Iniciante, "Aprenda a pedir o que precisa para a IA: contexto, exemplos e critérios claros.",
            [V("Anatomia de um bom prompt", 11), T("Contexto, papel e formato", 8), V("Few-shot: ensinando por exemplos", 14), V("Iterando e avaliando respostas", 13)],
            [new("O que melhora a qualidade de um prompt?", "Contexto e exemplos", "Ser vago", "Usar só uma palavra")]),

        new("IA no Dia a Dia", Nivel.Iniciante, "Use assistentes de IA para escrever, resumir, analisar e automatizar tarefas.",
            [V("O que a IA faz bem (e mal)", 10), V("Resumos e análises rápidas", 12), T("Automatizando tarefas repetitivas", 9)],
            [new("Devemos revisar o que a IA gera?", "Sempre", "Nunca", "Só às sextas")]),

        new("Comunicação Eficaz", Nivel.Iniciante, "Escuta ativa, clareza e assertividade para o trabalho em equipe.",
            [V("Escuta ativa", 9), T("Mensagens claras e objetivas", 7), V("Comunicação assíncrona", 12), V("Conversas difíceis", 16)],
            [new("Escuta ativa significa…", "Entender antes de responder", "Interromper", "Olhar o celular")]),

        new("Gestão do Tempo", Nivel.Iniciante, "Priorização, foco e rotina para entregar mais com menos estresse.",
            [V("Matriz de Eisenhower", 8), V("Blocos de foco", 10), T("Lidando com interrupções", 7)],
            [new("Priorizar é…", "Decidir o que fazer primeiro", "Fazer tudo ao mesmo tempo", "Adiar sempre")]),

        new("Feedback e Liderança", Nivel.Avancado, "Dê e receba feedback de forma construtiva e desenvolva pessoas.",
            [V("Modelo SBI de feedback", 12), V("Feedback difícil sem conflito", 18), T("1:1 que realmente funciona", 10), V("Desenvolvendo autonomia no time", 20)],
            [new("No modelo SBI, o \"B\" significa…", "Behavior (comportamento)", "Budget", "Backlog")]),
    ];

    private static readonly TrilhaDef[] Trilhas =
    [
        new("Formação React", "Do zero ao avançado", Nivel.Iniciante, "Frontend",
            ["React Básico", "TypeScript Essencial", "Tailwind CSS na Prática", "React Avançado"]),
        new("Formação IA", "Use IA para programar e para o dia a dia", Nivel.Intermediario, "Desenvolvimento",
            ["Claude Code", "Engenharia de Prompts", "IA no Dia a Dia"]),
        new("Backend com .NET", "Construa APIs profissionais com C#, .NET 8, EF Core e SQL Server.", Nivel.Intermediario, "Backend",
            ["C# do Zero", "APIs com .NET 8 Minimal APIs", "Entity Framework Core", "SQL Server para Devs"]),
        new("Soft Skills para Times", "Comunicação, organização e liderança para crescer na carreira.", Nivel.Iniciante, "Carreira",
            ["Comunicação Eficaz", "Gestão do Tempo", "Feedback e Liderança"]),
    ];

    private static readonly AlunoDef[] Alunos =
    [
        new("Ana Souza", "ana@demo.com", 1,
            [new("React Básico", -1, true, true), new("TypeScript Essencial", 3), new("Tailwind CSS na Prática", 1)]),
        new("Bruno Lima", "bruno@demo.com", 2,
            [new("C# do Zero", -1, true, true), new("APIs com .NET 8 Minimal APIs", 2)]),
        new("Carla Mendes", "carla@demo.com", 3,
            [new("Engenharia de Prompts", -1, true, false), new("IA no Dia a Dia", -1, true, true), new("Claude Code", 1)]),
        new("Elisa Rocha", "elisa@demo.com", 5,
            [new("Entity Framework Core", 4), new("SQL Server para Devs", 1), new("React Avançado", 2)]),
        // Parado há mais de 7 dias: aparece em "precisam de atenção" no painel.
        new("Diego Alves", "diego@demo.com", 12,
            [new("Comunicação Eficaz", 2), new("Gestão do Tempo", -1, true, true)]),
        // Nunca começou: situação "Sem atividade".
        new("Fábio Nunes", "fabio@demo.com", 0, []),
    ];
}
