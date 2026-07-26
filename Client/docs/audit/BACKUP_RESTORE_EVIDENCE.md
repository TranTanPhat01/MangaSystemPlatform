# Backup / Restore Evidence

Checked: 2026-07-26 Asia/Saigon

## PostgreSQL

PASS for clean database-level backup/restore.

Superseded evidence:

- The earlier `pg_dumpall` restore produced `ERROR: role "postgres" already exists`; that run is not accepted as clean evidence.
- The earlier PowerShell binary pipe attempt produced invalid/0-byte dump files; those files are not accepted as evidence.

Accepted evidence captured on 2026-07-26:

| Database | Dump size | SHA256 | Restore | Row count compare | Integrity |
|---|---:|---|---|---|---|
| IdentityDB | 17,734 bytes | `5E9BE9C2B02E8BE6AE8E3BEA6FB9D81D9ED1B4AC0DA71BDAE2D24F19CB2FD4C1` | PASS | 84 -> 84, match True | PASS |
| MangaManagementDB | 41,414 bytes | `D565D458D909ACE4E3465E47787323FCCA5B9B6F49BC2B2BE74657D47B67CABD` | PASS | 8 -> 8, match True | PASS |
| EditorialDB | 19,019 bytes | `0ADFF1B33454FEDD8611FF065821CE748F5E4F0B1E07A73D99D3E42563593B91` | PASS | 5 -> 5, match True | PASS |
| FileServiceDB | 9,394 bytes | `3CD460B39775ABFF254187A67E202FD9694BF7F2D1443BAD86247969D105BCE4` | PASS | 3 -> 3, match True | PASS |
| NotificationDB | 5,557 bytes | `E516BA41461A6F5D63E747C6E600F977B01F05E9101A0301D026DF0D02DD6A53` | PASS | 2 -> 2, match True | PASS |

Accepted command behavior:

- Dump method: `pg_dump -U postgres -Fc -d <Database> -f /tmp/<Database>.dump` inside the PostgreSQL container, followed by `docker cp`.
- Restore target: clean temporary container `manga-pg-clean-restore`.
- Restore method: `createdb`, then `pg_restore --exit-on-error --no-owner --no-privileges --clean --if-exists`.
- Exit code: 0.
- Role/global-object restore errors: none in accepted run.
- Final integrity SQL: PASS on restored databases.

Remaining limitation:

- API smoke against the clean restored container was not completed. This keeps broader production readiness from being fully accepted, but the database backup/restore mechanics are clean PASS.

## MinIO

PASS for object backup/restore and fresh presigned download.

Accepted evidence captured on 2026-07-26:

| Check | Result |
|---|---|
| Test object sensitivity | PASS: non-sensitive object content only |
| Source bucket/key | `manga-files` / `audit/minio-evidence.txt` |
| Restore bucket/key | `restore-test` / `audit/minio-evidence.txt` |
| Size | 42 bytes |
| Content type | `text/plain` |
| Source SHA256 | `12cecedae5ecdb4a015257d22ddaab79dc32fc7622239d4e6fa5567fdf715594` |
| Restored SHA256 | `12cecedae5ecdb4a015257d22ddaab79dc32fc7622239d4e6fa5567fdf715594` |
| Restore checksum match | PASS |
| Fresh presigned URL HTTP status | 200 |
| Presigned download SHA256 | `12cecedae5ecdb4a015257d22ddaab79dc32fc7622239d4e6fa5567fdf715594` |
| Presigned checksum match | PASS |

Accepted command behavior:

- MinIO alias set from container environment without printing credentials.
- `mc cp` copied source object to a local temp backup, then restored to `restore-test`.
- Restored object was downloaded and checksum-compared.
- A new presigned URL was generated after restore; it returned HTTP 200 and checksum matched.
