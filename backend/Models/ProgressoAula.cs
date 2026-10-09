namespace Peex.Api.Models;

public class ProgressoAula
{
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int AulaId { get; set; }
    public Aula Aula { get; set; } = null!;

    public DateTime ConcluidoEm { get; set; } = DateTime.UtcNow;
}
