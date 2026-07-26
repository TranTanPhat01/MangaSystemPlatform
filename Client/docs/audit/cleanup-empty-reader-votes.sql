-- Repair legacy aggregate reader_votes rows created before reader_id existed.
-- Strategy: archive legacy aggregate rows, then remove them from active individual votes.
-- Scope: only rows where reader_id = Guid.Empty.
--
-- Rollback instruction before COMMIT:
--   ROLLBACK;
--
-- Rollback instruction after COMMIT:
--   INSERT INTO public.reader_votes (id, issue_id, series_id, vote_count, rank_position, imported_by_user_id, created_at, reader_id)
--   SELECT id, issue_id, series_id, vote_count, rank_position, imported_by_user_id, created_at, reader_id
--   FROM public.reader_votes_legacy_archive
--   WHERE archive_reason = 'Legacy aggregate vote backfilled by AddReaderIdToReaderVotes migration';
--   DELETE FROM public.reader_votes_legacy_archive
--   WHERE archive_reason = 'Legacy aggregate vote backfilled by AddReaderIdToReaderVotes migration';

\pset pager off
\pset null '(null)'
\connect "EditorialDB"

BEGIN;

SELECT 'PREVIEW_empty_reader_votes_before' AS check_name, COUNT(*) AS row_count
FROM public.reader_votes
WHERE reader_id = '00000000-0000-0000-0000-000000000000'::uuid;

SELECT id, issue_id, series_id, reader_id, imported_by_user_id, vote_count, rank_position, created_at
FROM public.reader_votes
WHERE reader_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at, issue_id, series_id;

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

ALTER TABLE public.reader_votes
DROP CONSTRAINT IF EXISTS "CK_reader_votes_reader_id_not_empty";

ALTER TABLE public.reader_votes
ADD CONSTRAINT "CK_reader_votes_reader_id_not_empty"
CHECK (reader_id <> '00000000-0000-0000-0000-000000000000'::uuid);

SELECT 'POST_empty_reader_votes_after' AS check_name, COUNT(*) AS row_count
FROM public.reader_votes
WHERE reader_id = '00000000-0000-0000-0000-000000000000'::uuid;

SELECT 'ARCHIVE_rows' AS check_name, COUNT(*) AS row_count
FROM public.reader_votes_legacy_archive
WHERE archive_reason = 'Legacy aggregate vote backfilled by AddReaderIdToReaderVotes migration';

COMMIT;
