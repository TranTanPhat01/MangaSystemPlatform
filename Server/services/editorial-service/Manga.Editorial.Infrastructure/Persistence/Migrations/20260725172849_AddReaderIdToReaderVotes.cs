using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Editorial.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReaderIdToReaderVotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_reader_votes_issue_id_series_id\";");

            migrationBuilder.AddColumn<Guid>(
                name: "reader_id",
                table: "reader_votes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_reader_votes_issue_id_series_id_reader_id",
                table: "reader_votes",
                columns: new[] { "issue_id", "series_id", "reader_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_reader_votes_issue_id_series_id_reader_id",
                table: "reader_votes");

            migrationBuilder.DropColumn(
                name: "reader_id",
                table: "reader_votes");
        }
    }
}
