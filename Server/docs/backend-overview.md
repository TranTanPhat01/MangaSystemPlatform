# Tong quan Backend MangaSystemPlatform

## Kien truc

Backend nam trong thu muc `Server/` va duoc to chuc theo huong microservice:

- `gateway/Manga.Gateway`: API Gateway dung YARP Reverse Proxy.
- `services/identity-service`: dang ky, dang nhap, JWT, refresh token, role authorization.
- `services/manga-service`: quan ly studio, series, chapter, page, annotation, task, submission, revision.
- `services/file-service`: upload file local, metadata file, version file, download, soft delete.
- `services/editorial-service`: review, comment, board vote, issue, publication schedule, ranking, cancellation warning.
- `services/notification-service`: persisted notifications, unread count, read/delete actions, RabbitMQ consumers.
- `services/ai-service`: skeleton Python FastAPI.
- `shared/Manga.Contracts`: event contracts dung chung giua cac service.
- `shared/Manga.BuildingBlocks`: building blocks dung chung, hien co RabbitMQ event bus.
- `infrastructure`: Docker Compose va cau hinh ha tang local.

## Clean Architecture

Moi service .NET chinh duoc chia thanh cac layer:

- `Api`: controller, middleware, DI, authentication, Swagger.
- `Application`: DTO, interface, service/use case, validation co ban.
- `Domain`: entity va enum, khong phu thuoc layer khac.
- `Infrastructure`: EF Core DbContext, persistence, implementation cho cac abstraction.

Controller chi nhan request, lay current user tu JWT khi can, goi service o Application va tra DTO response. Khong tra entity truc tiep ra API.

## Database

PostgreSQL duoc dung lam database provider. Moi service co database rieng:

- Identity Service: `IdentityDB`
- Manga Management Service: `MangaManagementDB`
- File Service: `FileDB`
- Editorial Service: `EditorialDB`
- Notification Service: `NotificationDB`

Init script local nam tai:

```text
Server/infrastructure/postgres/init-databases.sql
```

## Authentication va Authorization

Identity Service phat hanh JWT access token va refresh token.

Gateway khong validate JWT trong phase hien tai. Gateway chi forward request va giu nguyen `Authorization` header. Viec validate token nam trong tung service.

## Event Bus

Phase 6 da them RabbitMQ event bus:

- Event contracts nam trong `Manga.Contracts.Events`.
- Abstraction `IEventBus` nam trong `Manga.BuildingBlocks.Messaging`.
- Implementation `RabbitMqEventBus` publish message vao durable topic exchange.
- RabbitMQ loi se duoc log, khong lam fail business flow chinh.

Consumer moi o muc skeleton de chuan bi cho Notification/Reatime phase sau.
