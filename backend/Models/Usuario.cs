using Microsoft.AspNetCore.Identity;

namespace Peex.Api.Models;

public class Usuario : IdentityUser<int>
{
    public string Nome { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
