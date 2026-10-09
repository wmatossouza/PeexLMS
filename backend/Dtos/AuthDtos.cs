using System.ComponentModel.DataAnnotations;

namespace Peex.Api.Dtos;

public record RegistrarRequest(
    [Required, MinLength(2)] string Nome,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Senha
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Senha
);

public record AuthResponse(
    string AccessToken,
    DateTime ExpiraEm,
    string Nome,
    string Email,
    IEnumerable<string> Papeis
);
