# Production Configuration Evidence

Last checked: 2026-07-26 Asia/Saigon

## Changes

- Replaced production fallback credentials in `Server/docker-compose.yml` with fail-fast `${VAR:?message}` syntax.
- Removed production localhost defaults for Gateway CORS and MinIO public URL.
- Set Gateway HTTPS redirection, HSTS, and forwarded headers defaults to enabled for production compose.
- Added `Server/.env.example` with placeholders only.

## Fail-Fast Evidence

Command:

```powershell
docker compose -f docker-compose.yml config
```

Result without required production environment:

```text
error while interpolating services.gateway.environment.Gateway__Cors__AllowedOrigins__0:
required variable GATEWAY__CORS__ALLOWEDORIGINS__0 is missing a value
```

This confirms production compose no longer silently falls back to localhost/default credentials when required variables are missing.

## Remaining Production Evidence Gaps

## Runtime Evidence Captured

Checked: 2026-07-26 13:16 Asia/Saigon.

| Check | Result |
|---|---|
| Docker runtime health | PASS: gateway, identity, manga, editorial, file, notification, PostgreSQL, RabbitMQ, Redis, MinIO all reported healthy via `docker ps`. |
| Gateway `/health/live` | PASS: HTTP 200 with `X-Correlation-Id`. |
| Gateway `/health/ready` | PASS: HTTP 200 with `X-Correlation-Id`. |
| Gateway authenticated `/health/services` | PASS: HTTP 200, services returned Healthy for gateway/identity/manga/file/editorial/notification. |
| Gateway `/swagger/index.html` | PASS: HTTP 404 in Production runtime. |
| SignalR hub route | PARTIAL: `/notifications/hub` returns 401 Unauthorized instead of 404, confirming route/auth protection; WSS behind TLS not proven. |
| Runtime production env | FAIL for production readiness: current running gateway container has localhost CORS, HSTS disabled, HTTPS redirection disabled, forwarded headers disabled. |
| HSTS forwarded HTTPS simulation | FAIL: no `Strict-Transport-Security` header observed because runtime HSTS/forwarded headers are disabled. |
| Production CORS simulation | FAIL for intended production origin: preflight to `https://app.example.com` did not return allow-origin because runtime CORS is configured for localhost. |

## Production-like Runtime Closure Attempt

Checked: 2026-07-26 14:03 Asia/Saigon.

Additional files:

- `Server/.env.production.example`
- `Server/.env.production.local` (ignored)
- `Server/docker-compose.production-like.yml`
- `docs/audit/PRODUCTION_RUNTIME_BEFORE.txt`
- `docs/audit/PRODUCTION_RUNTIME_AFTER.txt`

| Check | Result |
|---|---|
| Production-like env template | PASS: placeholder-only `.env.production.example` created. |
| Local production-like env | PASS: `.env.production.local` created and ignored by `.env.*`. |
| Compose validation | PASS: `docker compose --env-file .env.production.local config --quiet` exit 0. |
| Container recreate | PASS: `manga-prodlike` project created with fresh volumes and all required containers healthy. |
| Gateway runtime env | PASS: Production, HTTPS redirection true, HSTS true, ForwardedHeaders true, CORS `https://app.manga.local`. |
| MinIO public URL | PASS: file-api runtime uses `https://api.manga.local/minio`. |
| HTTPS endpoint | PASS: Node HTTPS request to `https://api.manga.local/health/live` via local DNS override returned 200. |
| HTTP redirect | PASS: HTTP `/health/live` returned 307 to `https://api.manga.local/health/live`. |
| Redirect loop | PASS: follow test returned 307 then 200. |
| HSTS | PASS: `Strict-Transport-Security: max-age=31536000`. |
| CORS | PASS: allowed `https://app.manga.local`; rejected `http://localhost:3000` and `https://evil.example`; no wildcard. |
| Swagger | PASS: gateway/service swagger routes returned 404 in Production. |
| Seed/bootstrap | PASS: fresh IdentityDB user count 0; log says development admin seeding disabled in Production. |
| SignalR/WSS | PARTIAL PASS: anonymous rejected; authenticated connection established over `wss://api.manga.local/notifications/hub`; realtime delivery/reconnect not verified. |
| Forwarded headers | PARTIAL: forged direct `X-Forwarded-*` ignored; trusted reverse-proxy processing not verified with a separate proxy. |
| Fresh migration/integrity | PASS: fresh prodlike DB integrity audit PASS. |
| Backup/restore | PARTIAL PASS: clean per-database PostgreSQL restore PASS; MinIO object restore/checksum/metadata/fresh presigned download PASS; restored-container API smoke not verified. |
| Partial failure/recovery | PARTIAL: Notification stop produced safe Gateway 502 with traceId and no sampled client stack trace; service recovered healthy; Admin UI, SignalR reconnect, MinIO failure not verified. |
| Full Playwright clean exit | NOT VERIFIED in this pass. |

## Remaining Production Evidence Gaps

- Prove trusted forwarded header behavior behind a separate intended reverse proxy.
- Complete existing DB clone upgrade evidence.
- Complete restored-container API smoke after PostgreSQL restore.
- Complete controlled Admin UI, SignalR reconnect, MinIO failure/recovery, and unrelated workflow smoke evidence.
- Fix/verify full Playwright clean exit.

## Result

PARTIAL PASS for production secret/URL hardening source changes.

Production Readiness Gate remains CONDITIONAL until the runtime evidence gaps above are closed.
