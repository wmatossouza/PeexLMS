using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Peex.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarConteudoAula : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Conteudo",
                table: "Aulas",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Conteudo",
                table: "Aulas");
        }
    }
}
