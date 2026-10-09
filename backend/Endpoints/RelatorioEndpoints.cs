using Microsoft.EntityFrameworkCore;
using Peex.Api.Data;
using Peex.Api.Dtos;

namespace Peex.Api.Endpoints;

public static class RelatorioEndpoints
{
    private const int DiasAtivo = 7;
    private const int DiasAtividade = 14;

    public static void MapRelatorioEndpoints(this WebApplication app)
    {
        var relatorios = app.MapGroup("/api/relatorios")
            .RequireAuthorization("AdminOuInstrutor")
            .WithOpenApi();

        relatorios.MapGet("/resumo", async (AppDbContext db) =>
        {
            var agora = DateTime.UtcNow;

            var alunoRoleId = await db.Roles.Where(r => r.Name == "Aluno").Select(r => r.Id).FirstOrDefaultAsync();
            var alunos = await db.Users
                .Where(u => db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == alunoRoleId))
                .Select(u => new { u.Id, u.Nome, Email = u.Email ?? string.Empty })
                .ToListAsync();
            var alunoIds = alunos.Select(a => a.Id).ToHashSet();

            var cursos = await db.Cursos
                .Select(c => new { c.Id, c.Titulo, c.Nivel, TotalAulas = c.Aulas.Count })
                .OrderBy(c => c.Titulo)
                .ToListAsync();
            var quizPorCurso = await db.Quizzes.ToDictionaryAsync(q => q.CursoId, q => q.Id);
            var totalTrilhas = await db.Trilhas.CountAsync();

            // Só conta progresso de quem hoje é Aluno (admin/instrutor não estudam).
            var conclusoes = (await db.ProgressoAulas
                    .Select(p => new { p.UsuarioId, p.Aula.CursoId, p.ConcluidoEm })
                    .ToListAsync())
                .Where(p => alunoIds.Contains(p.UsuarioId))
                .ToList();
            var respostas = (await db.QuizRespostas
                    .Select(r => new { r.UsuarioId, r.Quiz.CursoId, r.Acertos, r.Total, r.RespondidoEm })
                    .ToListAsync())
                .Where(r => alunoIds.Contains(r.UsuarioId))
                .ToList();

            // Percentual de cada par (aluno, curso) em que o aluno tem alguma atividade.
            var pares = new List<(int UsuarioId, int CursoId, double Percentual)>();
            foreach (var curso in cursos)
            {
                var temQuiz = quizPorCurso.ContainsKey(curso.Id);
                var totalItens = curso.TotalAulas + (temQuiz ? 1 : 0);
                var usuariosDoCurso = conclusoes.Where(c => c.CursoId == curso.Id).Select(c => c.UsuarioId)
                    .Union(respostas.Where(r => r.CursoId == curso.Id).Select(r => r.UsuarioId))
                    .Distinct();

                foreach (var usuarioId in usuariosDoCurso)
                {
                    var feitos = conclusoes.Count(c => c.CursoId == curso.Id && c.UsuarioId == usuarioId)
                        + (respostas.Any(r => r.CursoId == curso.Id && r.UsuarioId == usuarioId) ? 1 : 0);
                    var percentual = totalItens == 0 ? 0 : Math.Min(100.0, feitos * 100.0 / totalItens);
                    pares.Add((usuarioId, curso.Id, percentual));
                }
            }

            var relCursos = cursos.Select(c =>
            {
                var doCurso = pares.Where(p => p.CursoId == c.Id).ToList();
                var quizzes = respostas.Where(r => r.CursoId == c.Id).ToList();
                return new RelatorioCursoResponse(
                    c.Id, c.Titulo, c.Nivel.ToString(), c.TotalAulas,
                    doCurso.Count,
                    doCurso.Count(p => p.Percentual >= 100),
                    doCurso.Count == 0 ? 0 : Math.Round(doCurso.Average(p => p.Percentual), 1),
                    quizzes.Count,
                    quizzes.Count == 0 ? null : Math.Round(quizzes.Average(r => r.Total == 0 ? 0 : r.Acertos * 100.0 / r.Total), 1));
            }).ToList();

            var relAlunos = alunos.Select(a =>
            {
                var meusPares = pares.Where(p => p.UsuarioId == a.Id).ToList();
                var datas = conclusoes.Where(c => c.UsuarioId == a.Id).Select(c => c.ConcluidoEm)
                    .Concat(respostas.Where(r => r.UsuarioId == a.Id).Select(r => r.RespondidoEm))
                    .ToList();
                DateTime? ultima = datas.Count == 0 ? null : datas.Max();
                var situacao = ultima is null ? "Sem atividade"
                    : (agora - ultima.Value).TotalDays <= DiasAtivo ? "Ativo" : "Parado";

                return new RelatorioAlunoResponse(
                    a.Id, a.Nome, a.Email,
                    meusPares.Count,
                    meusPares.Count(p => p.Percentual >= 100),
                    conclusoes.Count(c => c.UsuarioId == a.Id),
                    meusPares.Count == 0 ? 0 : Math.Round(meusPares.Average(p => p.Percentual), 1),
                    ultima, situacao);
            }).OrderBy(a => a.Nome).ToList();

            var inicioAtividade = DateOnly.FromDateTime(agora).AddDays(-(DiasAtividade - 1));
            var atividade = Enumerable.Range(0, DiasAtividade)
                .Select(i => inicioAtividade.AddDays(i))
                .Select(dia => new AtividadeDiaResponse(
                    dia, conclusoes.Count(c => DateOnly.FromDateTime(c.ConcluidoEm) == dia)))
                .ToList();

            var todosPares = pares.Count;
            var notasQuiz = respostas.Select(r => r.Total == 0 ? 0 : r.Acertos * 100.0 / r.Total).ToList();

            return Results.Ok(new RelatorioResumoResponse(
                alunos.Count,
                relAlunos.Count(a => a.Situacao == "Ativo"),
                cursos.Count,
                totalTrilhas,
                conclusoes.Count,
                todosPares == 0 ? 0 : Math.Round(pares.Count(p => p.Percentual >= 100) * 100.0 / todosPares, 1),
                notasQuiz.Count == 0 ? null : Math.Round(notasQuiz.Average(), 1),
                relCursos, relAlunos, atividade));
        });
    }
}
