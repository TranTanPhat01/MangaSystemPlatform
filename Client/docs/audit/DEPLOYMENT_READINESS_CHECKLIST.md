# Deployment Readiness Checklist

Last checked: 2026-07-26 Asia/Saigon

Verdict: PARTIAL, still blocked for production deployment.

| Item | Status | Evidence / Blocker |
|---|---|---|
| No committed production secrets | PASS | Production compose now requires env vars; `.env.example` uses placeholders |
| No production localhost hard-code | PARTIAL PASS | Production compose requires non-localhost Gateway CORS and MinIO public URL; source `appsettings.json` still contains dev localhost defaults overridden by compose |
| HTTPS/WSS ready | PASS | HTTPS redirect/health, authenticated WSS, realtime delivery, reconnect, and no-duplicate evidence passed in production-like runtime |
| CORS production | PASS | Production-like runtime allows `https://app.manga.local` and rejects localhost/evil origins |
| Gateway routes | PASS | Runtime gateway live/ready/services returned HTTP 200 |
| SignalR WebSocket | PASS | Anonymous rejected; authenticated WSS connected through Gateway; realtime task notifications delivered; reconnect/no-duplicate passed |
| Rate limit | SOURCE REVIEW ONLY | Gateway rate limit env values exist; runtime behavior not tested |
| Restart policy | PASS | Compose uses `restart: unless-stopped` |
| Persistent volumes | PASS | Postgres, RabbitMQ, Redis, MinIO, Seq named volumes present |
| Database migration | PARTIAL PASS | Fresh prodlike migration/integrity PASS; existing DB clone upgrade not verified |
| Backup/restore note | PARTIAL PASS | Clean per-database PostgreSQL restore PASS and MinIO object restore/presigned download PASS; restored-container API smoke not completed |
| RabbitMQ durability | PARTIAL | Persistent volume present; exchange/queue durability not fully audited |
| MinIO persistence | PASS | MinIO named volume present and live endpoint HTTP 200 |
| Seed data disabled production | PARTIAL | Identity bootstrap disabled by default; broader seed policy not fully audited |
| Debug disabled | PARTIAL | Production env used in compose; debug exposure not fully audited |
| Swagger policy | PASS | Gateway/service swagger routes through Gateway returned 404 in Production-like runtime |
| Admin bootstrap security | PARTIAL | Bootstrap env-controlled and disabled by default; rotation/removal procedure still needed |
| Forwarded headers | PASS | Separate audit TLS reverse proxy with fixed IP `172.20.0.250`; Gateway trusts only that proxy; direct forged headers ignored |
| HSTS | PASS | HTTPS response contains `Strict-Transport-Security: max-age=31536000` |

## Required Before ACCEPTED

- Replace audit-only proxy with intended production reverse proxy image/config before public production deployment.
- Complete full repo production URL audit.
- Capture fresh migration and existing DB upgrade evidence.
- Complete restored-container API smoke after PostgreSQL backup/restore.
- Rerun full Playwright regression to clean completion; latest full run timed out after printing one fixed accessibility failure.
- Complete trusted reverse proxy forwarded-header evidence.
- Complete existing DB clone upgrade, restored DB API smoke, full partial failure/recovery, observability propagation, and Playwright clean-exit evidence.
