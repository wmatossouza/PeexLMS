using Microsoft.EntityFrameworkCore;
using Peex.Api.Data;
using Peex.Api.Dtos;
using Peex.Api.Models;

namespace Peex.Api.Endpoints;

public static class TrilhaEndpoints
{
    public static void MapTrilhaEndpoints(this WebApplication app)
    {
        var trilhas = app.MapGroup("/api/trilhas").WithOpenApi();

        trilhas.MapGet("/", async (AppDbContext db, string? categoria) =>
        {
            var query = db.Trilhas
                .Include(t => t.TrilhaCursos).ThenInclude(tc => tc.Curso).ThenInclude(c => c.Aulas)
                .AsQueryable();
            if (!string.IsNullOrWhiteSpace(categoria))
                query = query.Where(t => t.Categoria == categoria);

            var entidades = await query.OrderByDescending(t => t.CriadoEm).ToListAsync();
            return Results.Ok(entidades.Select(Projetar));
        });

        trilhas.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var trilha = await db.Trilhas
                .Include(t => t.TrilhaCursos).ThenInclude(tc => tc.Curso).ThenInclude(c => c.Aulas)
                .FirstOrDefaultAsync(t => t.Id == id);

            return trilha is null ? Results.NotFound() : Results.Ok(Projetar(trilha));
        });

        trilhas.MapPost("/", async (TrilhaRequest request, AppDbContext db) =>
        {
            var trilha = new Trilha
            {
                Titulo = request.Titulo,
                Descricao = request.Descricao,
                Nivel = request.Nivel,
                Categoria = request.Categoria,
            };
            db.Trilhas.Add(trilha);
            await db.SaveChangesAsync();
            return Results.Created($"/api/trilhas/{trilha.Id}", Projetar(trilha));
        }).RequireAuthorization("AdminOuInstrutor");

        trilhas.MapPut("/{id:int}", async (int id, TrilhaRequest request, AppDbContext db) =>
        {
            var trilha = await db.Trilhas.FindAsync(id);
            if (trilha is null) return Results.NotFound();

            trilha.Titulo = request.Titulo;
            trilha.Descricao = request.Descricao;
            trilha.Nivel = request.Nivel;
            trilha.Categoria = request.Categoria;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor");

        trilhas.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var trilha = await db.Trilhas.FindAsync(id);
            if (trilha is null) return Results.NotFound();

            db.Trilhas.Remove(trilha);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor");

        trilhas.MapPost("/{id:int}/cursos", async (int id, AssociarCursoRequest request, AppDbContext db) =>
        {
            var trilhaExiste = await db.Trilhas.AnyAsync(t => t.Id == id);
            var cursoExiste = await db.Cursos.AnyAsync(c => c.Id == request.CursoId);
            if (!trilhaExiste || !cursoExiste) return Results.NotFound();

            var jaAssociado = await db.TrilhaCursos.AnyAsync(tc => tc.TrilhaId == id && tc.CursoId == request.CursoId);
            if (jaAssociado) return Results.Conflict("Curso já associado a esta trilha.");

            db.TrilhaCursos.Add(new TrilhaCurso { TrilhaId = id, CursoId = request.CursoId, Ordem = request.Ordem });
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor");

        trilhas.MapDelete("/{id:int}/cursos/{cursoId:int}", async (int id, int cursoId, AppDbContext db) =>
        {
            var associacao = await db.TrilhaCursos.FirstOrDefaultAsync(tc => tc.TrilhaId == id && tc.CursoId == cursoId);
            if (associacao is null) return Results.NotFound();

            db.TrilhaCursos.Remove(associacao);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor");
    }

    private static TrilhaResponse Projetar(Trilha t) => new(
        t.Id, t.Titulo, t.Descricao, t.Nivel, t.Categoria, t.CriadoEm,
        t.TrilhaCursos
            .OrderBy(tc => tc.Ordem)
            .Select(tc => new CursoResumoResponse(tc.Curso.Id, tc.Curso.Titulo, tc.Curso.Nivel, tc.Ordem, tc.Curso.Aulas.Count))
            .ToList()
    );
}
