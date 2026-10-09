namespace Peex.Api.Models;

public class RefreshToken
{
    public int Id { get; set; }
    public string TokenHash { get; set; } = string.Empty;

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public DateTime ExpiraEm { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? RevogadoEm { get; set; }

    public bool Ativo => RevogadoEm is null && ExpiraEm > DateTime.UtcNow;
}
