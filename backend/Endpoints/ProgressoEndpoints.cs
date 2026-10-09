using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Peex.Api.Data;
using Peex.Api.Dtos;
using Peex.Api.Models;

namespace Peex.Api.Endpoints;

public static class ProgressoEndpoints
{
    public static void MapProgressoEndpoints(this WebApplication app)
    {
        var progresso = app.MapGroup("/api/progresso").RequireAuthorization().WithOpenApi();

        progresso.MapPost("/aulas/{aulaId:int}/concluir", async (int aulaId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var usuarioId = ObterUsuarioId(user);
            var aulaExiste = await db.Aulas.AnyAsync(a => a.Id == aulaId);
            if (!aulaExiste) return Results.NotFound();

            var jaConcluida = await db.ProgressoAulas.AnyAsync(p => p.UsuarioId == usuarioId && p.AulaId == aulaId);
            if (!jaConcluida)
            {
                db.ProgressoAulas.Add(new ProgressoAula { UsuarioId = usuarioId, AulaId = aulaId });
                await db.SaveChangesAsync();
            }

            return Results.NoContent();
        }).RequireAuthorization("Aluno");

        progresso.MapDelete("/aulas/{aulaId:int}/concluir", async (int aulaId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var usuarioId = ObterUsuarioId(user);
            var registro = await db.ProgressoAulas.FirstOrDefaultAsync(p => p.UsuarioId == usuarioId && p.AulaId == aulaId);
            if (registro is not null)
            {
                db.ProgressoAulas.Remove(registro);
                await db.SaveChangesAsync();
            }
            return Results.NoContent();
        }).RequireAuthorization("Aluno");

        progresso.MapGet("/meus-cursos", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var usuarioId = ObterUsuarioId(user);

            var cursoIdsComAula = db.ProgressoAulas
                .Where(p => p.UsuarioId == usuarioId)
                .Select(p => p.Aula.CursoId);
            var cursoIdsComQuiz = db.QuizRespostas
                .Where(r => r.UsuarioId == usuarioId)
                .Select(r => r.Quiz.CursoId);

            var cursoIds = await cursoIdsComAula.Union(cursoIdsComQuiz).ToListAsync();

            var resultado = new List<MeuCursoResponse>();
            foreach (var cursoId in cursoIds)
            {
                var curso = await db.Cursos.FindAsync(cursoId);
                if (curso is null) continue;

                var totalAulas = await db.Aulas.CountAsync(a => a.CursoId == cursoId);
                var concluidas = await db.ProgressoAulas.CountAsync(p => p.UsuarioId == usuarioId && p.Aula.CursoId == cursoId);
                var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.CursoId == cursoId);
                var quizResposta = quiz is null ? null
                    : await db.QuizRespostas.FirstOrDefaultAsync(r => r.UsuarioId == usuarioId && r.QuizId == quiz.Id);

                var progressoCurso = MontarProgressoCurso(cursoId, totalAulas, concluidas, quiz is not null, quizResposta);
                resultado.Add(new MeuCursoResponse(
                    cursoId, curso.Titulo, curso.Nivel,
                    progressoCurso.TotalAulas, progressoCurso.AulasConcluidas,
                    progressoCurso.TemQuiz, progressoCurso.QuizRespondido,
                    progressoCurso.QuizAcertos, progressoCurso.QuizTotal,
                    progressoCurso.Percentual
                ));
            }

            return Results.Ok(resultado.OrderByDescending(r => r.Percentual < 100).ThenBy(r => r.Titulo));
        }).RequireAuthorization("Aluno");

        progresso.MapGet("/cursos/{cursoId:int}", async (int cursoId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var cursoExiste = await db.Cursos.AnyAsync(c => c.Id == cursoId);
            if (!cursoExiste) return Results.NotFound("Curso não encontrado.");

            var usuarioId = ObterUsuarioId(user);
            var totalAulas = await db.Aulas.CountAsync(a => a.CursoId == cursoId);
            var concluidas = await db.ProgressoAulas
                .CountAsync(p => p.UsuarioId == usuarioId && p.Aula.CursoId == cursoId);

            var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.CursoId == cursoId);
            var quizResposta = quiz is null ? null
                : await db.QuizRespostas.FirstOrDefaultAsync(r => r.UsuarioId == usuarioId && r.QuizId == quiz.Id);

            var response = MontarProgressoCurso(cursoId, totalAulas, concluidas, quiz is not null, quizResposta);
            return Results.Ok(response);
        }).RequireAuthorization("Aluno");

        progresso.MapGet("/cursos/{cursoId:int}/alunos", async (int cursoId, AppDbContext db) =>
        {
            var cursoExiste = await db.Cursos.AnyAsync(c => c.Id == cursoId);
            if (!cursoExiste) return Results.NotFound("Curso não encontrado.");

            var totalAulas = await db.Aulas.CountAsync(a => a.CursoId == cursoId);
            var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.CursoId == cursoId);

            var alunoRoleId = await db.Roles.Where(r => r.Name == "Aluno").Select(r => r.Id).FirstOrDefaultAsync();
            var alunos = await db.Users
                .Where(u => db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == alunoRoleId))
                .Select(u => new { u.Id, u.Nome, u.Email })
                .ToListAsync();

            var resultado = new List<ProgressoAlunoResponse>();
            foreach (var aluno in alunos)
            {
                var concluidas = await db.ProgressoAulas
                    .CountAsync(p => p.UsuarioId == aluno.Id && p.Aula.CursoId == cursoId);
                var quizResposta = quiz is null ? null
                    : await db.QuizRespostas.FirstOrDefaultAsync(r => r.UsuarioId == aluno.Id && r.QuizId == quiz.Id);

                var totalItens = totalAulas + (quiz is null ? 0 : 1);
                var itensConcluidos = concluidas + (quizResposta is null ? 0 : 1);
                var percentual = totalItens == 0 ? 0 : Math.Round(itensConcluidos * 100.0 / totalItens, 1);

                resultado.Add(new ProgressoAlunoResponse(
                    aluno.Id, aluno.Nome, aluno.Email ?? string.Empty,
                    concluidas, totalAulas,
                    quizResposta is not null, quizResposta?.Acertos, quizResposta?.Total,
                    percentual
                ));
            }

            return Results.Ok(resultado);
        }).RequireAuthorization("AdminOuInstrutor");

        progresso.MapGet("/trilhas/{trilhaId:int}", async (int trilhaId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var usuarioId = ObterUsuarioId(user);
            var cursoIds = await db.TrilhaCursos
                .Where(tc => tc.TrilhaId == trilhaId)
                .Select(tc => tc.CursoId)
                .ToListAsync();

            if (cursoIds.Count == 0) return Results.NotFound("Trilha não encontrada ou sem cursos.");

            var progressoPorCurso = new List<ProgressoCursoNaTrilhaResponse>();
            foreach (var cursoId in cursoIds)
            {
                var total = await db.Aulas.CountAsync(a => a.CursoId == cursoId);
                var concluidas = await db.ProgressoAulas.CountAsync(p => p.UsuarioId == usuarioId && p.Aula.CursoId == cursoId);
                var percentualCurso = total == 0 ? 0 : Math.Round(concluidas * 100.0 / total, 1);
                progressoPorCurso.Add(new ProgressoCursoNaTrilhaResponse(cursoId, percentualCurso));
            }

            var percentualTrilha = Math.Round(progressoPorCurso.Average(p => p.Percentual), 1);
            return Results.Ok(new ProgressoTrilhaResponse(trilhaId, percentualTrilha, progressoPorCurso));
        }).RequireAuthorization("Aluno");
    }

    private static int ObterUsuarioId(ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ProgressoCursoResponse MontarProgressoCurso(
        int cursoId, int totalAulas, int aulasConcluidas, bool temQuiz, QuizResposta? quizResposta)
    {
        var totalItens = totalAulas + (temQuiz ? 1 : 0);
        var itensConcluidos = aulasConcluidas + (quizResposta is null ? 0 : 1);
        var percentual = totalItens == 0 ? 0 : Math.Round(itensConcluidos * 100.0 / totalItens, 1);

        return new ProgressoCursoResponse(
            cursoId, totalAulas, aulasConcluidas,
            temQuiz, quizResposta is not null, quizResposta?.Acertos, quizResposta?.Total,
            percentual
        );
    }
}
