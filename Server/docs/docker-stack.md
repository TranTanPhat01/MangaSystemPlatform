# Docker Stack

Run the stack from `Server`:

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
curl http://localhost:5200/health
curl http://localhost:5200/health/services
```

Only the gateway is published to the host at `http://localhost:5200`. API containers use
`8080` for REST and, where needed, `8081` for internal gRPC. Docker uses service names for
all inter-container traffic.

Database migrations are deliberately not run by `docker compose up`. Apply them explicitly
after infrastructure is healthy:

```powershell
dotnet ef database update --project services/identity-service/Manga.Identity.Infrastructure --startup-project services/identity-service/Manga.Identity.Api --context IdentityDbContext
dotnet ef database update --project services/manga-service/Manga.Management.Infrastructure --startup-project services/manga-service/Manga.Management.Api --context MangaManagementDbContext
dotnet ef database update --project services/file-service/Manga.File.Infrastructure --startup-project services/file-service/Manga.File.Api --context FileDbContext
dotnet ef database update --project services/editorial-service/Manga.Editorial.Infrastructure --startup-project services/editorial-service/Manga.Editorial.Api --context EditorialDbContext
dotnet ef database update --project services/notification-service/Manga.Notification.Infrastructure --startup-project services/notification-service/Manga.Notification.Api --context NotificationDbContext
```

No compose command removes named volumes. Set secrets such as `POSTGRES_PASSWORD`,
`RABBITMQ_DEFAULT_PASS`, `MINIO_ROOT_PASSWORD`, and `SEQ_ADMIN_PASSWORD` in a local `.env`
file before use outside local development.
