using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Peex.Api.Models;
using System.IdentityModel.Tokens.Jwt;

namespace Peex.Api.Services;

public class TokenService(IConfiguration config)
{
    public string GerarAccessToken(Usuario usuario, IList<string> papeis)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email ?? string.Empty),
            new("nome", usuario.Nome),
        };
        claims.AddRange(papeis.Select(papel => new Claim(ClaimTypes.Role, papel)));

        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(config["Jwt:AccessTokenMinutos"]!)),
            signingCredentials: credenciais
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GerarRefreshTokenBruto() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
