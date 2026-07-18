using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Management.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReaderModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "reader_bookmarks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    page_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reader_bookmarks", x => x.id);
                    table.ForeignKey(
                        name: "FK_reader_bookmarks_chapters_chapter_id",
                        column: x => x.chapter_id,
                        principalTable: "chapters",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_reader_bookmarks_pages_page_id",
                        column: x => x.page_id,
                        principalTable: "pages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reader_comments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: true),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reader_comments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reader_favorites",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reader_favorites", x => x.id);
                    table.ForeignKey(
                        name: "FK_reader_favorites_series_series_id",
                        column: x => x.series_id,
                        principalTable: "series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reading_histories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    page_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    visit_count = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reading_histories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reading_progresses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    page_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reading_progresses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "series_ratings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_series_ratings", x => x.id);
                    table.ForeignKey(
                        name: "FK_series_ratings_series_series_id",
                        column: x => x.series_id,
                        principalTable: "series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reader_bookmarks_chapter_id",
                table: "reader_bookmarks",
                column: "chapter_id");

            migrationBuilder.CreateIndex(
                name: "IX_reader_bookmarks_page_id",
                table: "reader_bookmarks",
                column: "page_id");

            migrationBuilder.CreateIndex(
                name: "IX_reader_bookmarks_user_id_chapter_id_page_id",
                table: "reader_bookmarks",
                columns: new[] { "user_id", "chapter_id", "page_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reader_bookmarks_user_id_created_at",
                table: "reader_bookmarks",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reader_comments_chapter_id_created_at",
                table: "reader_comments",
                columns: new[] { "chapter_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reader_comments_series_id_created_at",
                table: "reader_comments",
                columns: new[] { "series_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reader_favorites_series_id",
                table: "reader_favorites",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "IX_reader_favorites_user_id_created_at",
                table: "reader_favorites",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reader_favorites_user_id_series_id",
                table: "reader_favorites",
                columns: new[] { "user_id", "series_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reading_histories_user_id_chapter_id",
                table: "reading_histories",
                columns: new[] { "user_id", "chapter_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reading_histories_user_id_last_read_at",
                table: "reading_histories",
                columns: new[] { "user_id", "last_read_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reading_progresses_user_id_last_read_at",
                table: "reading_progresses",
                columns: new[] { "user_id", "last_read_at" });

            migrationBuilder.CreateIndex(
                name: "IX_reading_progresses_user_id_series_id",
                table: "reading_progresses",
                columns: new[] { "user_id", "series_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_series_ratings_series_id",
                table: "series_ratings",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "IX_series_ratings_user_id_series_id",
                table: "series_ratings",
                columns: new[] { "user_id", "series_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reader_bookmarks");

            migrationBuilder.DropTable(
                name: "reader_comments");

            migrationBuilder.DropTable(
                name: "reader_favorites");

            migrationBuilder.DropTable(
                name: "reading_histories");

            migrationBuilder.DropTable(
                name: "reading_progresses");

            migrationBuilder.DropTable(
                name: "series_ratings");
        }
    }
}
