namespace Peex.Api.Models;

public class QuizResposta
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;

    public int Acertos { get; set; }
    public int Total { get; set; }
    public DateTime RespondidoEm { get; set; } = DateTime.UtcNow;
}
