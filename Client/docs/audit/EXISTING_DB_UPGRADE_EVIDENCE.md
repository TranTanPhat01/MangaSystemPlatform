# Existing DB Upgrade Evidence

Checked: 2026-07-26 Asia/Saigon

## Result

NOT VERIFIED in this pass.

## Reason

The successful production-like runtime used fresh project-scoped volumes. A separate clone-upgrade flow from the previous existing database was not completed.

## Required to close

1. Dump the existing runtime databases.
2. Restore into a clone database/container.
3. Record row counts before migration.
4. Apply pending migrations to the clone only.
5. Record row counts after migration.
6. Run `docs/audit/final-database-integrity.sql`.
7. Start services against the clone and run smoke APIs.

Final System Acceptance cannot use this gate as PASS until the clone-upgrade evidence exists.
