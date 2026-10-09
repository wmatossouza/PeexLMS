using Peex.Api.Models;

namespace Peex.Api.Dtos;

public record MeuCursoResponse(
    int CursoId,
    string Titulo,
    Nivel Nivel,
    int TotalAulas,
    int AulasConcluidas,
    bool TemQuiz,
    bool QuizRespondido,
    int? QuizAcertos,
    int? QuizTotal,
    double Percentual
);

public record ProgressoCursoResponse(
    int CursoId,
    int TotalAulas,
    int AulasConcluidas,
    bool TemQuiz,
    bool QuizRespondido,
    int? QuizAcertos,
    int? QuizTotal,
    double Percentual
);

public record ProgressoCursoNaTrilhaResponse(int CursoId, double Percentual);

public record ProgressoTrilhaResponse(int TrilhaId, double Percentual, List<ProgressoCursoNaTrilhaResponse> Cursos);

public record ProgressoAlunoResponse(
    int UsuarioId,
    string Nome,
    string Email,
    int AulasConcluidas,
    int TotalAulas,
    bool QuizRespondido,
    int? QuizAcertos,
    int? QuizTotal,
    double Percentual
);
