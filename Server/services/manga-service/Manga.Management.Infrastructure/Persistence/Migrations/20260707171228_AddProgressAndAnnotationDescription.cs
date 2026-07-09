using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Management.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProgressAndAnnotationDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "progress_percentage",
                table: "chapters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "annotations",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "progress_percentage",
                table: "chapters");

            migrationBuilder.DropColumn(
                name: "description",
                table: "annotations");
        }
    }
}
