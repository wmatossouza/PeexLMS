namespace Peex.Api.Models;

public class TrilhaCurso
{
    public int TrilhaId { get; set; }
    public Trilha Trilha { get; set; } = null!;

    public int CursoId { get; set; }
    public Curso Curso { get; set; } = null!;

    public int Ordem { get; set; }
}
