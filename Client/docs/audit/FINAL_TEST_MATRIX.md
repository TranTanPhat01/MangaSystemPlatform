# Final Test Matrix

Last checked: 2026-07-26 Asia/Saigon

| Test Area | Command / Method | Result |
|---|---|---|
| Accessibility axe | `npx playwright test e2e/accessibility-audit.spec.ts`; targeted Board proposal rerun | PASS by runtime output: required scans report 0 critical/serious after Board fix; targeted command still timed out during dev-server teardown |
| TypeScript | `npx tsc --noEmit` | PASS |
| Frontend unit tests | `npm test` | PASS, 20 files / 89 tests |
| ESLint | `npm run lint`; `npx eslint . -f json -o docs/audit/eslint-report-after.json` | PASS, 0 errors / 240 warnings |
| Database repair | `cleanup-empty-reader-votes.sql` in `manga-postgres` | PASS, 11 archived / 11 removed from active |
| Database integrity | `docker exec manga-postgres psql -U postgres -f /tmp/final-database-integrity.sql` | PASS, all checks |
| Targeted backend tests | `dotnet test ... --filter BoardVotingRankingTests` | PASS, 15/15 |
| Authenticated health | Gateway `/health/live`, `/health/ready`, `/health/services` | PASS, HTTP 200 |
| Docker health | `docker inspect` health status | PASS for required runtime components |
| Production fail-fast config | `docker compose -f docker-compose.yml config` without env | PASS, fails on missing required vars |
| Runtime log redaction | Redacted `docker logs --tail 300` pattern scan; sampled safe 502 check | PARTIAL PASS |
| Backend full suite | `dotnet test MangaSystemPlatform.Server.sln` | PASS, 235/235 |
| Full Playwright regression | `npm run test:e2e` / isolated accessibility reruns | FAIL: TLS trust/auth redirect fixed and isolated accessibility command now exits naturally, but exits 1 due browser-side API/CORS network-error UI causing axe failures; full suite exit 0 not proven |
| Fresh migration | zero-db migration run + final integrity SQL | PASS |
| Existing DB upgrade | restore clone + migrate | NOT VERIFIED |
| PostgreSQL backup/restore | per-database `pg_dump -Fc`, clean `pg_restore`, row-count compare, restored integrity SQL | PASS for restore mechanics; restored API smoke NOT VERIFIED |
| MinIO backup/restore | `mc cp` object backup/restore, metadata/checksum compare, fresh presigned download | PASS |
| Trusted proxy | audit-only TLS reverse proxy container -> Gateway internal HTTP; direct forged headers test | PASS |
| WSS realtime/reconnect | `node tools\audit\wss-realtime-evidence.js` | PASS: realtime delivery, reconnect, no duplicate, DB/API count |
| Partial failure | stop/start Notification service, Gateway safe 502, recovery healthy | PARTIAL PASS; Admin UI, SignalR reconnect, MinIO failure not verified |
