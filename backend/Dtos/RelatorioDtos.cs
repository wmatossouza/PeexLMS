namespace Peex.Api.Dtos;

public record RelatorioCursoResponse(
    int Id,
    string Titulo,
    string Nivel,
    int TotalAulas,
    int AlunosIniciaram,
    int AlunosConcluiram,
    double PercentualMedio,
    int QuizRespondidos,
    double? QuizMediaAcerto
);

public record RelatorioAlunoResponse(
    int Id,
    string Nome,
    string Email,
    int CursosIniciados,
    int CursosConcluidos,
    int AulasConcluidas,
    double PercentualMedio,
    DateTime? UltimaAtividade,
    string Situacao
);

public record AtividadeDiaResponse(DateOnly Data, int AulasConcluidas);

public record RelatorioResumoResponse(
    int TotalAlunos,
    int AlunosAtivos7Dias,
    int TotalCursos,
    int TotalTrilhas,
    int AulasConcluidas,
    double TaxaConclusao,
    double? QuizMediaAcerto,
    List<RelatorioCursoResponse> Cursos,
    List<RelatorioAlunoResponse> Alunos,
    List<AtividadeDiaResponse> Atividade
);
