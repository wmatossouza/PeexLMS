namespace Peex.Api.Models;

public enum Nivel
{
    Iniciante,
    Intermediario,
    Avancado
}

public class Trilha
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public Nivel Nivel { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<TrilhaCurso> TrilhaCursos { get; set; } = [];
}
