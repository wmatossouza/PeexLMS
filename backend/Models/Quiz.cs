namespace Peex.Api.Models;

public class Quiz
{
    public int Id { get; set; }

    public int CursoId { get; set; }
    public Curso Curso { get; set; } = null!;

    public string Titulo { get; set; } = string.Empty;

    public List<QuizPergunta> Perguntas { get; set; } = [];
}

public class QuizPergunta
{
    public int Id { get; set; }

    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;

    public string Enunciado { get; set; } = string.Empty;
    public int Ordem { get; set; }

    public List<QuizOpcao> Opcoes { get; set; } = [];
}

public class QuizOpcao
{
    public int Id { get; set; }

    public int QuizPerguntaId { get; set; }
    public QuizPergunta Pergunta { get; set; } = null!;

    public string Texto { get; set; } = string.Empty;
    public bool Correta { get; set; }
}
