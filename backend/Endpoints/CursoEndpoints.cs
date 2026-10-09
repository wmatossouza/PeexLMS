using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Peex.Api.Data;
using Peex.Api.Dtos;
using Peex.Api.Models;

namespace Peex.Api.Endpoints;

public static class CursoEndpoints
{
    public static void MapCursoEndpoints(this WebApplication app)
    {
        var cursos = app.MapGroup("/api/cursos").WithOpenApi();

        cursos.MapGet("/", async (AppDbContext db) =>
        {
            var lista = await db.Cursos
                .OrderByDescending(c => c.CriadoEm)
                .Select(c => new { c.Id, c.Titulo, c.Descricao, c.Nivel, c.CriadoEm, TotalAulas = c.Aulas.Count })
                .ToListAsync();
            return Results.Ok(lista);
        });

        cursos.MapGet("/{id:int}", async (int id, AppDbContext db, ClaimsPrincipal user) =>
        {
            var curso = await db.Cursos
                .Include(c => c.Aulas)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (curso is null) return Results.NotFound();

            var concluidas = new HashSet<int>();
            var usuarioId = ObterUsuarioId(user);
            if (usuarioId is not null)
            {
                concluidas = (await db.ProgressoAulas
                    .Where(p => p.UsuarioId == usuarioId && p.Aula.CursoId == id)
                    .Select(p => p.AulaId)
                    .ToListAsync())
                    .ToHashSet();
            }

            return Results.Ok(Projetar(curso, concluidas));
        });

        cursos.MapPost("/", async (CursoRequest request, AppDbContext db) =>
        {
            var curso = new Curso { Titulo = request.Titulo, Descricao = request.Descricao, Nivel = request.Nivel };
            db.Cursos.Add(curso);
            await db.SaveChangesAsync();
            return Results.Created($"/api/cursos/{curso.Id}", Projetar(curso, []));
        }).RequireAuthorization("AdminOuInstrutor");

        cursos.MapPut("/{id:int}", async (int id, CursoRequest request, AppDbContext db) =>
        {
            var curso = await db.Cursos.FindAsync(id);
            if (curso is null) return Results.NotFound();

            curso.Titulo = request.Titulo;
            curso.Descricao = request.Descricao;
            curso.Nivel = request.Nivel;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor");

        cursos.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var curso = await db.Cursos.FindAsync(id);
            if (curso is null) return Results.NotFound();

            db.Cursos.Remove(curso);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor");
    }

    private static int? ObterUsuarioId(ClaimsPrincipal user)
    {
        var valor = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(valor, out var id) ? id : null;
    }

    private static CursoResponse Projetar(Curso c, HashSet<int> aulasConcluidas) => new(
        c.Id, c.Titulo, c.Descricao, c.Nivel, c.CriadoEm,
        c.Aulas.OrderBy(a => a.Ordem).Select(a => new AulaResponse(
            a.Id, a.CursoId, a.Titulo, a.TipoConteudo, a.UrlConteudo, a.Ordem, a.DuracaoMinutos,
            aulasConcluidas.Contains(a.Id), a.Conteudo
        )).ToList()
    );
}
