# Huong dan chay local va kiem thu

## 1. Build solution

Chay trong thu muc `Server/`:

```bash
dotnet build
```

## 2. Chay infrastructure

Chay trong thu muc `Server/`:

```bash
docker compose up -d
```

Dung infrastructure:

```bash
docker compose down
```

Reset volume:

```bash
docker compose down -v
```

## 3. Endpoint infrastructure

PostgreSQL:

```text
Host: localhost
Port: 5432
User: postgres
Password: 12345
```

RabbitMQ:

```text
Dashboard: http://localhost:15672
User: guest
Password: guest
```

Redis:

```text
localhost:6379
```

MinIO:

```text
API: http://localhost:9000
Console: http://localhost:9001
User: admin
Password: password123
```

## 4. Database migration

Identity:

```powershell
Add-Migration InitialIdentity -Project Manga.Identity.Infrastructure -StartupProject Manga.Identity.Api -OutputDir Persistence\Migrations
Update-Database -Project Manga.Identity.Infrastructure -StartupProject Manga.Identity.Api
```

Manga Management:

```powershell
Add-Migration InitialMangaManagement -Project Manga.Management.Infrastructure -StartupProject Manga.Management.Api -OutputDir Persistence\Migrations
Update-Database -Project Manga.Management.Infrastructure -StartupProject Manga.Management.Api
```

File Service:

```powershell
Add-Migration InitialFileService -Project Manga.File.Infrastructure -StartupProject Manga.File.Api -OutputDir Persistence\Migrations
Update-Database -Project Manga.File.Infrastructure -StartupProject Manga.File.Api
```

Editorial Service:

```powershell
Add-Migration InitialEditorialService -Project Manga.Editorial.Infrastructure -StartupProject Manga.Editorial.Api -OutputDir Persistence\Migrations
Update-Database -Project Manga.Editorial.Infrastructure -StartupProject Manga.Editorial.Api
```

Neu dung `dotnet ef` tu thu muc `Server/`, vi du:

```bash
dotnet ef database update --project services/identity-service/Manga.Identity.Infrastructure --startup-project services/identity-service/Manga.Identity.Api
```

## 5. Test qua Swagger

Thu tu de test co ban:

1. Chay Identity Service.
2. Mo Swagger cua Identity Service.
3. Register user.
4. Login de lay JWT access token.
5. Chay cac service khac.
6. Bam Authorize trong Swagger va nhap:

```text
Bearer <access_token>
```

7. Goi cac endpoint can authentication.

## 6. Test qua Gateway

Chay cac API service va Gateway, sau do goi:

```text
GET /gateway/health
POST /identity/auth/login
GET /manga/series
GET /files/my
GET /editorial/issues
```

Gateway chi forward request, JWT van duoc validate tai tung service.

## 7. Test Event Bus

1. Chay infrastructure:

```bash
docker compose up -d
```

2. Mo RabbitMQ dashboard:

```text
http://localhost:15672
guest / guest
```

3. Chay File Service va upload file.

Ket qua mong doi: log service co event `FileUploadedEvent`.

4. Chay Manga Service va create task.

Ket qua mong doi: log service co event `TaskAssignedEvent`.

5. Submit hoac approve task.

Ket qua mong doi: log service co event `TaskSubmittedEvent` hoac `TaskApprovedEvent`.

6. Chay Editorial Service va calculate ranking.

Ket qua mong doi: log service co event `RankingCalculatedEvent`. Neu co warning, co them `CancellationWarningCreatedEvent`.

## 8. Ghi chu hien tai

- Docker Compose hien chi chay infrastructure, chua build/chay .NET services.
- MinIO moi duoc cau hinh san cho phase sau, File Service hien dang dung local file storage.
- Consumer RabbitMQ moi la skeleton, chua co notification/realtime handler.
