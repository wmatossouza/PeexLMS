using System.ComponentModel.DataAnnotations;
using Peex.Api.Models;

namespace Peex.Api.Dtos;

public record TrilhaRequest(
    [Required, MinLength(3)] string Titulo,
    [Required] string Descricao,
    Nivel Nivel,
    [Required] string Categoria
);

public record TrilhaResponse(
    int Id,
    string Titulo,
    string Descricao,
    Nivel Nivel,
    string Categoria,
    DateTime CriadoEm,
    List<CursoResumoResponse> Cursos
);

public record CursoResumoResponse(int Id, string Titulo, Nivel Nivel, int Ordem, int TotalAulas);

public record CursoRequest(
    [Required, MinLength(3)] string Titulo,
    [Required] string Descricao,
    Nivel Nivel
);

public record CursoResponse(
    int Id,
    string Titulo,
    string Descricao,
    Nivel Nivel,
    DateTime CriadoEm,
    List<AulaResponse> Aulas
);

public record AssociarCursoRequest(int CursoId, int Ordem);

public record AulaRequest(
    [Required, MinLength(3)] string Titulo,
    TipoConteudo TipoConteudo,
    [Required] string UrlConteudo,
    int Ordem,
    [Range(1, 600)] int DuracaoMinutos,
    string? Conteudo = null
);

public record AulaResponse(
    int Id,
    int CursoId,
    string Titulo,
    TipoConteudo TipoConteudo,
    string UrlConteudo,
    int Ordem,
    int DuracaoMinutos,
    bool Concluida,
    string? Conteudo
);
