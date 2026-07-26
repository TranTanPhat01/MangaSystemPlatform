# Fresh Migration Evidence

Checked: 2026-07-26 Asia/Saigon

## Runtime

Fresh production-like Docker Compose project: `manga-prodlike`

The project was created with fresh project-scoped volumes:

- `manga-prodlike_manga_postgres_data`
- `manga-prodlike_manga_rabbitmq_data`
- `manga-prodlike_manga_redis_data`
- `manga-prodlike_manga_minio_data`
- `manga-prodlike_manga_seq_data`

## Commands

```powershell
docker compose -p manga-prodlike --env-file .env.production.local up -d --build --force-recreate
docker compose -p manga-prodlike --env-file .env.production.local ps
docker cp docs/audit/final-database-integrity.sql manga-postgres:/tmp/final-database-integrity.sql
docker exec manga-postgres psql -U postgres -f /tmp/final-database-integrity.sql
```

## Result

- Compose production-like runtime recreate: PASS after switching to fresh project-scoped volumes.
- All API containers healthy: PASS.
- Database migrations applied during service startup: PASS by service health and schema-dependent integrity audit.
- Final database integrity audit on fresh runtime: PASS.
- `READER_empty_reader_id`: 0.
- Duplicate/orphan/inbox/outbox checks: 0 errors.

## Notes

The first recreate attempt against the old default project reused the previous Postgres named volume and failed authentication because the old initialized database password did not match the new production-like env. No volume was deleted. The successful run used a separate compose project with fresh volumes.
