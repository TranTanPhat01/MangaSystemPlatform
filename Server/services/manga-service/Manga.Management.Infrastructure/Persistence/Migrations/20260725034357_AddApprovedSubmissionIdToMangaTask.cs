using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Management.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovedSubmissionIdToMangaTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "approved_submission_id",
                table: "manga_tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_reading_progresses_chapter_id",
                table: "reading_progresses",
                column: "chapter_id");

            migrationBuilder.CreateIndex(
                name: "IX_reading_progresses_page_id",
                table: "reading_progresses",
                column: "page_id");

            migrationBuilder.CreateIndex(
                name: "IX_reading_progresses_series_id",
                table: "reading_progresses",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "IX_reading_histories_chapter_id",
                table: "reading_histories",
                column: "chapter_id");

            migrationBuilder.CreateIndex(
                name: "IX_reading_histories_page_id",
                table: "reading_histories",
                column: "page_id");

            migrationBuilder.CreateIndex(
                name: "IX_reading_histories_series_id",
                table: "reading_histories",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "IX_reader_bookmarks_user_id_chapter_id",
                table: "reader_bookmarks",
                columns: new[] { "user_id", "chapter_id" },
                unique: true,
                filter: "\"page_id\" IS NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_reader_comments_chapters_chapter_id",
                table: "reader_comments",
                column: "chapter_id",
                principalTable: "chapters",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_reader_comments_series_series_id",
                table: "reader_comments",
                column: "series_id",
                principalTable: "series",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_reading_histories_chapters_chapter_id",
                table: "reading_histories",
                column: "chapter_id",
                principalTable: "chapters",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_reading_histories_pages_page_id",
                table: "reading_histories",
                column: "page_id",
                principalTable: "pages",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_reading_histories_series_series_id",
                table: "reading_histories",
                column: "series_id",
                principalTable: "series",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_reading_progresses_chapters_chapter_id",
                table: "reading_progresses",
                column: "chapter_id",
                principalTable: "chapters",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_reading_progresses_pages_page_id",
                table: "reading_progresses",
                column: "page_id",
                principalTable: "pages",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_reading_progresses_series_series_id",
                table: "reading_progresses",
                column: "series_id",
                principalTable: "series",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_reader_comments_chapters_chapter_id",
                table: "reader_comments");

            migrationBuilder.DropForeignKey(
                name: "FK_reader_comments_series_series_id",
                table: "reader_comments");

            migrationBuilder.DropForeignKey(
                name: "FK_reading_histories_chapters_chapter_id",
                table: "reading_histories");

            migrationBuilder.DropForeignKey(
                name: "FK_reading_histories_pages_page_id",
                table: "reading_histories");

            migrationBuilder.DropForeignKey(
                name: "FK_reading_histories_series_series_id",
                table: "reading_histories");

            migrationBuilder.DropForeignKey(
                name: "FK_reading_progresses_chapters_chapter_id",
                table: "reading_progresses");

            migrationBuilder.DropForeignKey(
                name: "FK_reading_progresses_pages_page_id",
                table: "reading_progresses");

            migrationBuilder.DropForeignKey(
                name: "FK_reading_progresses_series_series_id",
                table: "reading_progresses");

            migrationBuilder.DropIndex(
                name: "IX_reading_progresses_chapter_id",
                table: "reading_progresses");

            migrationBuilder.DropIndex(
                name: "IX_reading_progresses_page_id",
                table: "reading_progresses");

            migrationBuilder.DropIndex(
                name: "IX_reading_progresses_series_id",
                table: "reading_progresses");

            migrationBuilder.DropIndex(
                name: "IX_reading_histories_chapter_id",
                table: "reading_histories");

            migrationBuilder.DropIndex(
                name: "IX_reading_histories_page_id",
                table: "reading_histories");

            migrationBuilder.DropIndex(
                name: "IX_reading_histories_series_id",
                table: "reading_histories");

            migrationBuilder.DropIndex(
                name: "IX_reader_bookmarks_user_id_chapter_id",
                table: "reader_bookmarks");

            migrationBuilder.DropColumn(
                name: "approved_submission_id",
                table: "manga_tasks");
        }
    }
}
