namespace Peex.Api.Models;

public class Curso
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public Nivel Nivel { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<Aula> Aulas { get; set; } = [];
    public List<TrilhaCurso> TrilhaCursos { get; set; } = [];
}
