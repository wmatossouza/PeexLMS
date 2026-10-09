using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Peex.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarQuiz : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Quizzes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CursoId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quizzes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quizzes_Cursos_CursoId",
                        column: x => x.CursoId,
                        principalTable: "Cursos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizPerguntas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuizId = table.Column<int>(type: "int", nullable: false),
                    Enunciado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizPerguntas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizPerguntas_Quizzes_QuizId",
                        column: x => x.QuizId,
                        principalTable: "Quizzes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizRespostas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    QuizId = table.Column<int>(type: "int", nullable: false),
                    Acertos = table.Column<int>(type: "int", nullable: false),
                    Total = table.Column<int>(type: "int", nullable: false),
                    RespondidoEm = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizRespostas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizRespostas_AspNetUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuizRespostas_Quizzes_QuizId",
                        column: x => x.QuizId,
                        principalTable: "Quizzes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizOpcoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuizPerguntaId = table.Column<int>(type: "int", nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Correta = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizOpcoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizOpcoes_QuizPerguntas_QuizPerguntaId",
                        column: x => x.QuizPerguntaId,
                        principalTable: "QuizPerguntas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizOpcoes_QuizPerguntaId",
                table: "QuizOpcoes",
                column: "QuizPerguntaId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizPerguntas_QuizId",
                table: "QuizPerguntas",
                column: "QuizId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizRespostas_QuizId",
                table: "QuizRespostas",
                column: "QuizId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizRespostas_UsuarioId_QuizId",
                table: "QuizRespostas",
                columns: new[] { "UsuarioId", "QuizId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_CursoId",
                table: "Quizzes",
                column: "CursoId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuizOpcoes");

            migrationBuilder.DropTable(
                name: "QuizRespostas");

            migrationBuilder.DropTable(
                name: "QuizPerguntas");

            migrationBuilder.DropTable(
                name: "Quizzes");
        }
    }
}
