-- Final database integrity audit for MangaSystemPlatform.
-- Read-only: SELECT-only checks, intended for psql execution against manga-postgres.
-- Expected acceptance result: every P0/P1 check returns PASS.

\pset pager off
\pset null '(null)'

\connect "MangaManagementDB"

SELECT 'MANGA_duplicate_task_submission_version' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT task_id, file_id, submitted_by_user_id, COUNT(*)
  FROM public.submissions
  GROUP BY task_id, file_id, submitted_by_user_id
  HAVING COUNT(*) > 1
) d;

SELECT 'MANGA_approved_submission_missing' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.manga_tasks t
LEFT JOIN public.submissions s ON s.id = t.approved_submission_id
WHERE t.approved_submission_id IS NOT NULL AND s.id IS NULL;

SELECT 'MANGA_approved_task_without_submission' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.manga_tasks
WHERE status = 'Approved' AND approved_submission_id IS NULL;

SELECT 'MANGA_orphan_submission' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.submissions s
LEFT JOIN public.manga_tasks t ON t.id = s.task_id
WHERE t.id IS NULL;

SELECT 'MANGA_failed_outbox_messages' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.outbox_messages
WHERE "Status" IN ('Failed', 'DeadLetter', 'Poison');

SELECT 'MANGA_failed_inbox_messages' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.inbox_messages
WHERE "Status" IN ('Failed', 'DeadLetter', 'Poison');

\connect "EditorialDB"

SELECT 'EDITORIAL_duplicate_active_review_round' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT chapter_id, COUNT(*)
  FROM public.editorial_reviews
  WHERE status IN ('Pending', 'InReview', 'RevisionRequested')
  GROUP BY chapter_id
  HAVING COUNT(*) > 1
) d;

SELECT 'EDITORIAL_orphan_review_comment' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.editorial_comments c
LEFT JOIN public.editorial_reviews r ON r.id = c.review_id
WHERE r.id IS NULL;

SELECT 'EDITORIAL_invalid_terminal_status' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.editorial_reviews
WHERE status IN ('Approved', 'Rejected') AND updated_at IS NULL;

SELECT 'BOARD_duplicate_board_vote' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT series_id, proposal_id, voter_user_id, COUNT(*)
  FROM public.board_votes
  GROUP BY series_id, proposal_id, voter_user_id
  HAVING COUNT(*) > 1
) d;

SELECT 'PUBLICATION_duplicate_active_schedule' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT series_id, chapter_id, COUNT(*)
  FROM public.publication_schedules
  WHERE status IN ('Scheduled', 'Active')
  GROUP BY series_id, chapter_id
  HAVING COUNT(*) > 1
) d;

SELECT 'PUBLICATION_published_without_published_at' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.publication_schedules
WHERE status = 'Published' AND published_at IS NULL;

SELECT 'READER_duplicate_reader_vote' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT issue_id, series_id, reader_id, COUNT(*)
  FROM public.reader_votes
  GROUP BY issue_id, series_id, reader_id
  HAVING COUNT(*) > 1
) d;

SELECT 'READER_empty_reader_id' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.reader_votes
WHERE reader_id = '00000000-0000-0000-0000-000000000000'::uuid;

SELECT 'RANKING_duplicate_ranking_run' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT issue_id, generated_at, COUNT(*)
  FROM public.ranking_snapshots
  GROUP BY issue_id, generated_at
  HAVING COUNT(*) > 1
) d;

SELECT 'RANKING_duplicate_rank_position' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT ranking_snapshot_id, rank_position, COUNT(*)
  FROM public.ranking_items
  GROUP BY ranking_snapshot_id, rank_position
  HAVING COUNT(*) > 1
) d;

SELECT 'RANKING_orphan_ranking_item' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.ranking_items i
LEFT JOIN public.ranking_snapshots s ON s.id = i.ranking_snapshot_id
WHERE s.id IS NULL;

SELECT 'CANCELLATION_duplicate_open_warning' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT series_id, risk_level, created_at::date, COUNT(*)
  FROM public.cancellation_warnings
  WHERE is_resolved = false
  GROUP BY series_id, risk_level, created_at::date
  HAVING COUNT(*) > 1
) d;

SELECT 'CANCELLATION_resolved_without_timestamp' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.cancellation_warnings
WHERE is_resolved = true AND resolved_at IS NULL;

SELECT 'EDITORIAL_failed_outbox_messages' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.outbox_messages
WHERE "Status" IN ('Failed', 'DeadLetter', 'Poison');

SELECT 'EDITORIAL_failed_inbox_messages' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.inbox_messages
WHERE "Status" IN ('Failed', 'DeadLetter', 'Poison');

\connect "NotificationDB"

SELECT 'NOTIFICATION_duplicate_notification' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT "SourceEventId", "UserId", "Type", COUNT(*)
  FROM public.notifications
  WHERE "SourceEventId" IS NOT NULL
  GROUP BY "SourceEventId", "UserId", "Type"
  HAVING COUNT(*) > 1
) d;

SELECT 'NOTIFICATION_read_status_without_read_at' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.notifications
WHERE "Status" = 'Read' AND "ReadAt" IS NULL;

SELECT 'NOTIFICATION_unread_status_with_read_at' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.notifications
WHERE "Status" <> 'Read' AND "ReadAt" IS NOT NULL;

SELECT 'NOTIFICATION_empty_source_event_id' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.notifications
WHERE "SourceEventId" = '00000000-0000-0000-0000-000000000000'::uuid;

SELECT 'NOTIFICATION_failed_inbox_messages' AS check_name, COUNT(*) AS error_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.inbox_messages
WHERE "Status" IN ('Failed', 'DeadLetter', 'Poison');
