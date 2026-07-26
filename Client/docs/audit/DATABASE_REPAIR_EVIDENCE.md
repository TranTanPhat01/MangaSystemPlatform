# Database Repair Evidence

Last checked: 2026-07-26 Asia/Saigon

## Root Cause

The 11 invalid `reader_votes.reader_id = 00000000-0000-0000-0000-000000000000` rows were created by migration `20260725172849_AddReaderIdToReaderVotes`, which added `reader_id` as `NOT NULL` with `Guid.Empty` as the default value.

The affected rows predate the individual-reader voting model. Their shape is legacy aggregate data:

- one active row per issue/series,
- `vote_count` values such as 450,
- no true per-reader ownership field,
- `imported_by_user_id` points to importer/board user, not reader owner.

## Strategy

Option C - Legacy Aggregate Archival.

The repair does not invent reader IDs, does not assign admin IDs, and does not delete all reader votes. It archives only rows with `reader_id = Guid.Empty`, then removes those rows from active `reader_votes` so the active table contains only individual reader votes.

## Repair Script

Script: `docs/audit/cleanup-empty-reader-votes.sql`

Safety properties:

- SELECT preview before mutation.
- Transactional repair.
- Scope limited to `reader_id = Guid.Empty`.
- Archive table keeps original id, issue, series, vote count, imported user, created timestamp, and archive reason.
- Adds CHECK constraint: `reader_id <> Guid.Empty`.
- Includes rollback instructions in comments.

## Runtime Result

Repair execution output: `docs/audit/cleanup-empty-reader-votes-result.txt`

Runtime result:

| Step | Count |
|---|---:|
| Preview empty reader votes before repair | 11 |
| Archived legacy rows | 11 |
| Deleted active Guid.Empty rows | 11 |
| Empty reader votes after repair | 0 |

Constraint added:

```sql
CHECK (reader_id <> '00000000-0000-0000-0000-000000000000'::uuid)
```

Runtime constraint verification:

```text
CK_reader_votes_reader_id_not_empty | CHECK ((reader_id <> '00000000-0000-0000-0000-000000000000'::uuid))
```

Final integrity rerun: `docs/audit/final-database-integrity-result.txt`

`READER_empty_reader_id = 0`, all final database integrity checks returned PASS.
