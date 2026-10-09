using Microsoft.EntityFrameworkCore;
using Peex.Api.Data;
using Peex.Api.Dtos;
using Peex.Api.Models;

namespace Peex.Api.Endpoints;

public static class AulaEndpoints
{
    public static void MapAulaEndpoints(this WebApplication app)
    {
        app.MapPost("/api/cursos/{cursoId:int}/aulas", async (int cursoId, AulaRequest request, AppDbContext db) =>
        {
            var cursoExiste = await db.Cursos.AnyAsync(c => c.Id == cursoId);
            if (!cursoExiste) return Results.NotFound("Curso não encontrado.");

            var aula = new Aula
            {
                CursoId = cursoId,
                Titulo = request.Titulo,
                TipoConteudo = request.TipoConteudo,
                UrlConteudo = request.UrlConteudo,
                Ordem = request.Ordem,
                DuracaoMinutos = request.DuracaoMinutos,
                Conteudo = request.Conteudo,
            };
            db.Aulas.Add(aula);
            await db.SaveChangesAsync();
            return Results.Created($"/api/aulas/{aula.Id}", Projetar(aula));
        }).RequireAuthorization("AdminOuInstrutor").WithOpenApi();

        app.MapPut("/api/aulas/{id:int}", async (int id, AulaRequest request, AppDbContext db) =>
        {
            var aula = await db.Aulas.FindAsync(id);
            if (aula is null) return Results.NotFound();

            aula.Titulo = request.Titulo;
            aula.TipoConteudo = request.TipoConteudo;
            aula.UrlConteudo = request.UrlConteudo;
            aula.Ordem = request.Ordem;
            aula.DuracaoMinutos = request.DuracaoMinutos;
            aula.Conteudo = request.Conteudo;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor").WithOpenApi();

        app.MapDelete("/api/aulas/{id:int}", async (int id, AppDbContext db) =>
        {
            var aula = await db.Aulas.FindAsync(id);
            if (aula is null) return Results.NotFound();

            db.Aulas.Remove(aula);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor").WithOpenApi();
    }

    private static AulaResponse Projetar(Aula a) => new(
        a.Id, a.CursoId, a.Titulo, a.TipoConteudo, a.UrlConteudo, a.Ordem, a.DuracaoMinutos, false, a.Conteudo
    );
}
