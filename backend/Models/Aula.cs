namespace Peex.Api.Models;

public enum TipoConteudo
{
    Video,
    Texto
}

public class Aula
{
    public int Id { get; set; }

    public int CursoId { get; set; }
    public Curso Curso { get; set; } = null!;

    public string Titulo { get; set; } = string.Empty;
    public TipoConteudo TipoConteudo { get; set; }
    public string UrlConteudo { get; set; } = string.Empty;
    public int Ordem { get; set; }
    public int DuracaoMinutos { get; set; }
    public string? Conteudo { get; set; }
}
