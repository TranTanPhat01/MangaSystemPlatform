using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manga.Editorial.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ArchiveLegacyReaderVotesAndAddReaderIdCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS public.reader_votes_legacy_archive
                (
                    id uuid PRIMARY KEY,
                    issue_id uuid NOT NULL,
                    series_id uuid NOT NULL,
                    reader_id uuid NOT NULL,
                    vote_count integer NOT NULL,
                    rank_position integer NULL,
                    imported_by_user_id uuid NOT NULL,
                    created_at timestamp with time zone NOT NULL,
                    archived_at timestamp with time zone NOT NULL DEFAULT now(),
                    archive_reason text NOT NULL
                );

                INSERT INTO public.reader_votes_legacy_archive
                (
                    id,
                    issue_id,
                    series_id,
                    reader_id,
                    vote_count,
                    rank_position,
                    imported_by_user_id,
                    created_at,
                    archived_at,
                    archive_reason
                )
                SELECT
                    id,
                    issue_id,
                    series_id,
                    reader_id,
                    vote_count,
                    rank_position,
                    imported_by_user_id,
                    created_at,
                    now(),
                    'Legacy aggregate vote backfilled by AddReaderIdToReaderVotes migration'
                FROM public.reader_votes
                WHERE reader_id = '00000000-0000-0000-0000-000000000000'::uuid
                ON CONFLICT (id) DO NOTHING;

                DELETE FROM public.reader_votes
                WHERE reader_id = '00000000-0000-0000-0000-000000000000'::uuid;
                """);

            migrationBuilder.AddCheckConstraint(
                name: "CK_reader_votes_reader_id_not_empty",
                table: "reader_votes",
                sql: "reader_id <> '00000000-0000-0000-0000-000000000000'::uuid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_reader_votes_reader_id_not_empty",
                table: "reader_votes");
        }
    }
}
