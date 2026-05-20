using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Editorial.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialEditorialService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "board_votes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    proposal_id = table.Column<Guid>(type: "uuid", nullable: true),
                    voter_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vote_value = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_board_votes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cancellation_warnings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    risk_level = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_resolved = table.Column<bool>(type: "boolean", nullable: false),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cancellation_warnings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "editorial_reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reviewer_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    decision_note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_editorial_reviews", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issues",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    issue_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    release_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_issues", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ranking_snapshots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    issue_id = table.Column<Guid>(type: "uuid", nullable: false),
                    generated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    generated_by_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ranking_snapshots", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reader_votes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    issue_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vote_count = table.Column<int>(type: "integer", nullable: false),
                    rank_position = table.Column<int>(type: "integer", nullable: true),
                    imported_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reader_votes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "editorial_comments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    review_id = table.Column<Guid>(type: "uuid", nullable: false),
                    page_id = table.Column<Guid>(type: "uuid", nullable: true),
                    annotation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    comment_text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_resolved = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_editorial_comments", x => x.id);
                    table.ForeignKey(
                        name: "FK_editorial_comments_editorial_reviews_review_id",
                        column: x => x.review_id,
                        principalTable: "editorial_reviews",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "publication_schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chapter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    issue_id = table.Column<Guid>(type: "uuid", nullable: true),
                    publication_type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    scheduled_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_publication_schedules", x => x.id);
                    table.ForeignKey(
                        name: "FK_publication_schedules_issues_issue_id",
                        column: x => x.issue_id,
                        principalTable: "issues",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ranking_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ranking_snapshot_id = table.Column<Guid>(type: "uuid", nullable: false),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vote_count = table.Column<int>(type: "integer", nullable: false),
                    rank_position = table.Column<int>(type: "integer", nullable: false),
                    score = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ranking_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_ranking_items_ranking_snapshots_ranking_snapshot_id",
                        column: x => x.ranking_snapshot_id,
                        principalTable: "ranking_snapshots",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_board_votes_series_id_proposal_id_voter_user_id",
                table: "board_votes",
                columns: new[] { "series_id", "proposal_id", "voter_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_editorial_comments_review_id",
                table: "editorial_comments",
                column: "review_id");

            migrationBuilder.CreateIndex(
                name: "IX_publication_schedules_issue_id",
                table: "publication_schedules",
                column: "issue_id");

            migrationBuilder.CreateIndex(
                name: "IX_ranking_items_ranking_snapshot_id",
                table: "ranking_items",
                column: "ranking_snapshot_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "board_votes");

            migrationBuilder.DropTable(
                name: "cancellation_warnings");

            migrationBuilder.DropTable(
                name: "editorial_comments");

            migrationBuilder.DropTable(
                name: "publication_schedules");

            migrationBuilder.DropTable(
                name: "ranking_items");

            migrationBuilder.DropTable(
                name: "reader_votes");

            migrationBuilder.DropTable(
                name: "editorial_reviews");

            migrationBuilder.DropTable(
                name: "issues");

            migrationBuilder.DropTable(
                name: "ranking_snapshots");
        }
    }
}
