using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Peex.Api.Data;
using Peex.Api.Dtos;
using Peex.Api.Models;

namespace Peex.Api.Endpoints;

public static class QuizEndpoints
{
    public static void MapQuizEndpoints(this WebApplication app)
    {
        app.MapPost("/api/cursos/{cursoId:int}/quiz", async (int cursoId, QuizRequest request, AppDbContext db) =>
        {
            var erro = ValidarPerguntas(request);
            if (erro is not null) return Results.BadRequest(erro);

            var cursoExiste = await db.Cursos.AnyAsync(c => c.Id == cursoId);
            if (!cursoExiste) return Results.NotFound("Curso não encontrado.");

            var jaExiste = await db.Quizzes.AnyAsync(q => q.CursoId == cursoId);
            if (jaExiste) return Results.Conflict("Este curso já tem um quiz. Use PUT para editar.");

            var quiz = MontarQuiz(cursoId, request);
            db.Quizzes.Add(quiz);
            await db.SaveChangesAsync();
            return Results.Created($"/api/cursos/{cursoId}/quiz", ProjetarAdmin(quiz));
        }).RequireAuthorization("AdminOuInstrutor").WithOpenApi();

        app.MapGet("/api/cursos/{cursoId:int}/quiz", async (int cursoId, AppDbContext db) =>
        {
            var quiz = await CarregarQuiz(db, q => q.CursoId == cursoId);
            if (quiz is null) return Results.NotFound();
            return Results.Ok(ProjetarAdmin(quiz));
        }).RequireAuthorization("AdminOuInstrutor").WithOpenApi();

        app.MapPut("/api/quiz/{id:int}", async (int id, QuizRequest request, AppDbContext db) =>
        {
            var erro = ValidarPerguntas(request);
            if (erro is not null) return Results.BadRequest(erro);

            var quiz = await CarregarQuiz(db, q => q.Id == id);
            if (quiz is null) return Results.NotFound();

            quiz.Titulo = request.Titulo;
            db.QuizPerguntas.RemoveRange(quiz.Perguntas);
            quiz.Perguntas = request.Perguntas.Select(ProjetarPerguntaNova).ToList();
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor").WithOpenApi();

        app.MapDelete("/api/quiz/{id:int}", async (int id, AppDbContext db) =>
        {
            var quiz = await db.Quizzes.FindAsync(id);
            if (quiz is null) return Results.NotFound();

            db.Quizzes.Remove(quiz);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("AdminOuInstrutor").WithOpenApi();

        app.MapGet("/api/cursos/{cursoId:int}/quiz/responder", async (int cursoId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var quiz = await CarregarQuiz(db, q => q.CursoId == cursoId);
            if (quiz is null) return Results.NotFound();

            var usuarioId = ObterUsuarioId(user);
            var ultimaResposta = await db.QuizRespostas
                .FirstOrDefaultAsync(r => r.UsuarioId == usuarioId && r.QuizId == quiz.Id);

            return Results.Ok(ProjetarParaResponder(quiz, ultimaResposta));
        }).RequireAuthorization("Aluno").WithOpenApi();

        app.MapPost("/api/quiz/{id:int}/responder", async (int id, ResponderQuizRequest request, ClaimsPrincipal user, AppDbContext db) =>
        {
            var quiz = await CarregarQuiz(db, q => q.Id == id);
            if (quiz is null) return Results.NotFound();

            var perguntaIds = quiz.Perguntas.Select(p => p.Id).ToHashSet();
            var respondidoIds = request.Respostas.Select(r => r.QuizPerguntaId).ToHashSet();
            if (!perguntaIds.SetEquals(respondidoIds))
                return Results.BadRequest("É preciso responder todas as perguntas do quiz.");

            var acertos = 0;
            foreach (var resposta in request.Respostas)
            {
                var pergunta = quiz.Perguntas.First(p => p.Id == resposta.QuizPerguntaId);
                var opcao = pergunta.Opcoes.FirstOrDefault(o => o.Id == resposta.QuizOpcaoId);
                if (opcao is null) return Results.BadRequest("Opção inválida para uma das perguntas.");
                if (opcao.Correta) acertos++;
            }

            var usuarioId = ObterUsuarioId(user);
            var registro = await db.QuizRespostas
                .FirstOrDefaultAsync(r => r.UsuarioId == usuarioId && r.QuizId == quiz.Id);

            if (registro is null)
            {
                registro = new QuizResposta { UsuarioId = usuarioId, QuizId = quiz.Id };
                db.QuizRespostas.Add(registro);
            }

            registro.Acertos = acertos;
            registro.Total = quiz.Perguntas.Count;
            registro.RespondidoEm = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new ResultadoQuizResponse(quiz.Id, registro.Acertos, registro.Total, registro.RespondidoEm));
        }).RequireAuthorization("Aluno").WithOpenApi();
    }

    private static string? ValidarPerguntas(QuizRequest request)
    {
        if (request.Perguntas.Count == 0) return "O quiz precisa de ao menos uma pergunta.";
        foreach (var pergunta in request.Perguntas)
        {
            if (pergunta.Opcoes.Count < 2) return "Cada pergunta precisa de ao menos duas opções.";
            if (pergunta.Opcoes.Count(o => o.Correta) != 1)
                return "Cada pergunta precisa de exatamente uma opção correta.";
        }
        return null;
    }

    private static Task<Quiz?> CarregarQuiz(AppDbContext db, System.Linq.Expressions.Expression<Func<Quiz, bool>> predicate) =>
        db.Quizzes
            .Include(q => q.Perguntas.OrderBy(p => p.Ordem))
            .ThenInclude(p => p.Opcoes)
            .FirstOrDefaultAsync(predicate)!;

    private static Quiz MontarQuiz(int cursoId, QuizRequest request) => new()
    {
        CursoId = cursoId,
        Titulo = request.Titulo,
        Perguntas = request.Perguntas.Select(ProjetarPerguntaNova).ToList(),
    };

    private static QuizPergunta ProjetarPerguntaNova(QuizPerguntaRequest p) => new()
    {
        Enunciado = p.Enunciado,
        Ordem = p.Ordem,
        Opcoes = p.Opcoes.Select(o => new QuizOpcao { Texto = o.Texto, Correta = o.Correta }).ToList(),
    };

    private static QuizResponse ProjetarAdmin(Quiz quiz) => new(
        quiz.Id, quiz.CursoId, quiz.Titulo,
        quiz.Perguntas.OrderBy(p => p.Ordem).Select(p => new QuizPerguntaResponse(
            p.Id, p.Enunciado, p.Ordem,
            p.Opcoes.Select(o => new QuizOpcaoResponse(o.Id, o.Texto, o.Correta)).ToList()
        )).ToList()
    );

    private static QuizParaResponderResponse ProjetarParaResponder(Quiz quiz, QuizResposta? ultimaResposta) => new(
        quiz.Id, quiz.CursoId, quiz.Titulo,
        quiz.Perguntas.OrderBy(p => p.Ordem).Select(p => new QuizPerguntaParaResponderResponse(
            p.Id, p.Enunciado, p.Ordem,
            p.Opcoes.Select(o => new QuizOpcaoParaResponderResponse(o.Id, o.Texto)).ToList()
        )).ToList(),
        ultimaResposta is null ? null : new ResultadoQuizResponse(quiz.Id, ultimaResposta.Acertos, ultimaResposta.Total, ultimaResposta.RespondidoEm)
    );

    private static int ObterUsuarioId(ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
