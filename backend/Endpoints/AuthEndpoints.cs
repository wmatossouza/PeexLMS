using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Peex.Api.Data;
using Peex.Api.Dtos;
using Peex.Api.Models;
using Peex.Api.Services;

namespace Peex.Api.Endpoints;

public static class AuthEndpoints
{
    private const string RefreshCookieName = "refreshToken";
    private static readonly TimeSpan RefreshTokenDuracao = TimeSpan.FromDays(7);

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth").WithOpenApi();

        auth.MapPost("/registrar", async (
            RegistrarRequest request,
            UserManager<Usuario> userManager,
            RoleManager<IdentityRole<int>> roleManager,
            TokenService tokenService,
            AppDbContext db,
            HttpContext http,
            IWebHostEnvironment env) =>
        {
            var usuario = new Usuario
            {
                UserName = request.Email,
                Email = request.Email,
                Nome = request.Nome,
            };

            var resultado = await userManager.CreateAsync(usuario, request.Senha);
            if (!resultado.Succeeded)
                return Results.ValidationProblem(
                    resultado.Errors.ToDictionary(e => e.Code, e => new[] { e.Description }));

            if (!await roleManager.RoleExistsAsync("Aluno"))
                await roleManager.CreateAsync(new IdentityRole<int>("Aluno"));
            await userManager.AddToRoleAsync(usuario, "Aluno");

            return await EmitirSessao(usuario, ["Aluno"], tokenService, db, http, env);
        });

        auth.MapPost("/login", async (
            LoginRequest request,
            UserManager<Usuario> userManager,
            TokenService tokenService,
            AppDbContext db,
            HttpContext http,
            IWebHostEnvironment env) =>
        {
            var usuario = await userManager.FindByEmailAsync(request.Email);
            if (usuario is null)
                return Results.Unauthorized();

            if (await userManager.IsLockedOutAsync(usuario))
                return Results.Problem("Conta temporariamente bloqueada por excesso de tentativas. Tente novamente mais tarde.", statusCode: StatusCodes.Status423Locked);

            var senhaValida = await userManager.CheckPasswordAsync(usuario, request.Senha);
            if (!senhaValida)
            {
                await userManager.AccessFailedAsync(usuario);
                return Results.Unauthorized();
            }

            await userManager.ResetAccessFailedCountAsync(usuario);
            var papeis = await userManager.GetRolesAsync(usuario);
            return await EmitirSessao(usuario, papeis, tokenService, db, http, env);
        });

        auth.MapPost("/refresh", async (
            HttpContext http,
            UserManager<Usuario> userManager,
            TokenService tokenService,
            AppDbContext db,
            IWebHostEnvironment env) =>
        {
            if (!http.Request.Cookies.TryGetValue(RefreshCookieName, out var tokenBruto) || string.IsNullOrEmpty(tokenBruto))
                return Results.Unauthorized();

            var hash = tokenService.HashToken(tokenBruto);
            var registro = await db.RefreshTokens
                .Include(r => r.Usuario)
                .FirstOrDefaultAsync(r => r.TokenHash == hash);

            if (registro is null || !registro.Ativo)
                return Results.Unauthorized();

            registro.RevogadoEm = DateTime.UtcNow;
            var papeis = await userManager.GetRolesAsync(registro.Usuario);
            var resposta = await EmitirSessao(registro.Usuario, papeis, tokenService, db, http, env);
            await db.SaveChangesAsync();
            return resposta;
        });

        auth.MapPost("/logout", async (HttpContext http, TokenService tokenService, AppDbContext db) =>
        {
            if (http.Request.Cookies.TryGetValue(RefreshCookieName, out var tokenBruto) && !string.IsNullOrEmpty(tokenBruto))
            {
                var hash = tokenService.HashToken(tokenBruto);
                var registro = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
                if (registro is not null)
                {
                    registro.RevogadoEm = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                }
            }

            http.Response.Cookies.Delete(RefreshCookieName);
            return Results.NoContent();
        });
    }

    private static async Task<IResult> EmitirSessao(
        Usuario usuario,
        IEnumerable<string> papeis,
        TokenService tokenService,
        AppDbContext db,
        HttpContext http,
        IWebHostEnvironment env)
    {
        var listaPapeis = papeis.ToList();
        var accessToken = tokenService.GerarAccessToken(usuario, listaPapeis);
        var refreshTokenBruto = tokenService.GerarRefreshTokenBruto();

        db.RefreshTokens.Add(new RefreshToken
        {
            UsuarioId = usuario.Id,
            TokenHash = tokenService.HashToken(refreshTokenBruto),
            ExpiraEm = DateTime.UtcNow.Add(RefreshTokenDuracao),
        });
        await db.SaveChangesAsync();

        http.Response.Cookies.Append(RefreshCookieName, refreshTokenBruto, new CookieOptions
        {
            HttpOnly = true,
            Secure = !env.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            Expires = DateTimeOffset.UtcNow.Add(RefreshTokenDuracao),
        });

        return Results.Ok(new AuthResponse(
            accessToken,
            DateTime.UtcNow.AddMinutes(15),
            usuario.Nome,
            usuario.Email!,
            listaPapeis
        ));
    }
}
