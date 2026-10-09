using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Peex.Api.Models;

namespace Peex.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<Usuario, IdentityRole<int>, int>(options)
{
    public DbSet<Trilha> Trilhas => Set<Trilha>();
    public DbSet<Curso> Cursos => Set<Curso>();
    public DbSet<Aula> Aulas => Set<Aula>();
    public DbSet<TrilhaCurso> TrilhaCursos => Set<TrilhaCurso>();
    public DbSet<ProgressoAula> ProgressoAulas => Set<ProgressoAula>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizPergunta> QuizPerguntas => Set<QuizPergunta>();
    public DbSet<QuizOpcao> QuizOpcoes => Set<QuizOpcao>();
    public DbSet<QuizResposta> QuizRespostas => Set<QuizResposta>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<TrilhaCurso>(entity =>
        {
            entity.HasKey(tc => new { tc.TrilhaId, tc.CursoId });
            entity.HasOne(tc => tc.Trilha)
                .WithMany(t => t.TrilhaCursos)
                .HasForeignKey(tc => tc.TrilhaId);
            entity.HasOne(tc => tc.Curso)
                .WithMany(c => c.TrilhaCursos)
                .HasForeignKey(tc => tc.CursoId);
        });

        builder.Entity<ProgressoAula>(entity =>
        {
            entity.HasKey(p => new { p.UsuarioId, p.AulaId });
            entity.HasOne(p => p.Usuario)
                .WithMany()
                .HasForeignKey(p => p.UsuarioId);
            entity.HasOne(p => p.Aula)
                .WithMany()
                .HasForeignKey(p => p.AulaId);
        });

        builder.Entity<Aula>()
            .HasOne(a => a.Curso)
            .WithMany(c => c.Aulas)
            .HasForeignKey(a => a.CursoId);

        builder.Entity<RefreshToken>()
            .HasIndex(r => r.TokenHash)
            .IsUnique();

        builder.Entity<Quiz>(entity =>
        {
            entity.HasOne(q => q.Curso)
                .WithOne()
                .HasForeignKey<Quiz>(q => q.CursoId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(q => q.CursoId).IsUnique();
        });

        builder.Entity<QuizPergunta>()
            .HasOne(p => p.Quiz)
            .WithMany(q => q.Perguntas)
            .HasForeignKey(p => p.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<QuizOpcao>()
            .HasOne(o => o.Pergunta)
            .WithMany(p => p.Opcoes)
            .HasForeignKey(o => o.QuizPerguntaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<QuizResposta>(entity =>
        {
            entity.HasIndex(r => new { r.UsuarioId, r.QuizId }).IsUnique();
            entity.HasOne(r => r.Usuario)
                .WithMany()
                .HasForeignKey(r => r.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Quiz)
                .WithMany()
                .HasForeignKey(r => r.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
