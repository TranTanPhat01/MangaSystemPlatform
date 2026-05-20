# Nhat ky trien khai cac phase

Tai lieu nay ghi lai cac hang muc backend da trien khai den thoi diem hien tai.

## Phase Server Foundation

Da tao solution tong:

```text
Server/MangaSystemPlatform.Server.sln
```

Da tao cau truc microservice trong `Server/`:

- Gateway YARP: `gateway/Manga.Gateway`
- Identity Service
- Manga Management Service
- Editorial Service
- File Service
- AI Service skeleton bang FastAPI
- Shared libraries: `Manga.SharedKernel`, `Manga.Contracts`, `Manga.BuildingBlocks`
- Infrastructure folders
- Tests folder

Da add cac project .NET vao solution tong.

## Phase 1 - Identity Service

Da trien khai authentication va authorization co ban:

- Register
- Login
- Refresh token
- Logout
- Get current user
- Seed roles ban dau
- Role-based authorization

Roles:

- Admin
- Mangaka
- Assistant
- TantouEditor
- EditorialBoard

Database tables:

- `users`
- `roles`
- `user_roles`
- `refresh_tokens`

Da cau hinh JWT, Swagger, EF Core PostgreSQL va migration `InitialIdentity`.

## Phase 2 - Manga Management Service

Da trien khai core manga workflow:

- Studio
- Studio member
- Series
- Chapter
- Page
- Annotation
- Manga task
- Submission
- Revision

Da tao DTO, service interface, service implementation, DbContext, EF configuration va API endpoints theo route `/manga/...`.

Da cau hinh JWT Authorization, Swagger, PostgreSQL va migration `InitialMangaManagement`.

## Phase 3 - File Service

Da trien khai File Service voi local file storage:

- Upload file multipart form-data
- Luu metadata vao PostgreSQL
- Luu file vao local storage
- Download file
- Lay metadata file
- Lay public URL/path
- File version history
- Soft delete
- Lay danh sach file cua current user

Da them validation:

- Extension hop le: `.png`, `.jpg`, `.jpeg`, `.webp`, `.pdf`, `.psd`
- Max file size: 20MB
- Khong luu binary file trong database

Da cau hinh Swagger upload file, JWT Authorization, PostgreSQL va migration `InitialFileService`.

## Phase 4 - Editorial Service

Da trien khai Editorial Service:

- Editorial review
- Editorial comment
- Board vote
- Issue
- Publication schedule
- Reader vote
- Ranking snapshot
- Ranking item
- Cancellation warning

Business rules da co:

- VoteCount khong am
- Mot user chi vote board mot lan theo series/proposal context
- Ranking tinh theo VoteCount giam dan
- Publish schedule co `PublishedAt`
- Tao cancellation warning khi ranking thap theo rule hien tai

Da cau hinh JWT Authorization, Swagger, PostgreSQL va migration `InitialEditorialService`.

## Phase 5 - API Gateway Integration

Da cau hinh `Manga.Gateway` dung YARP Reverse Proxy.

Gateway route:

- `/identity/{**catch-all}` den Identity API
- `/manga/{**catch-all}` den Manga Management API
- `/files/{**catch-all}` den File API
- `/editorial/{**catch-all}` den Editorial API

Da them:

- CORS cho `http://localhost:3000` va `http://localhost:5173`
- Health check `GET /gateway/health`
- Swagger cho Gateway health/info endpoint

Gateway giu nguyen `Authorization` header khi forward request.

## Phase 6 - Infrastructure va Event Bus

Da chuan hoa infrastructure local bang Docker Compose:

- PostgreSQL 16
- RabbitMQ 3 Management
- Redis 7
- MinIO

Da tao:

- Network `manga-network`
- Volumes cho postgres, rabbitmq, redis, minio
- Healthcheck co ban
- `.env.example`
- Init script tao database rieng cho tung service

Da them event contracts:

- `FileUploadedEvent`
- `TaskAssignedEvent`
- `TaskSubmittedEvent`
- `TaskApprovedEvent`
- `ChapterSubmittedForReviewEvent`
- `ChapterApprovedEvent`
- `RankingCalculatedEvent`
- `CancellationWarningCreatedEvent`

Da them RabbitMQ building block:

- `IEventBus`
- `IIntegrationEventHandler<TEvent>`
- `IEventConsumer`
- `RabbitMqOptions`
- `RabbitMqEventBus`
- `RabbitMqBackgroundConsumer`
- `AddRabbitMqEventBus(...)`

Da tich hop publisher:

- File Service publish `FileUploadedEvent`
- Manga Service publish task events
- Editorial Service publish chapter approval, ranking, cancellation warning events

Ghi chu: consumer hien moi o muc skeleton, chua gan business handler thuc te.

## Phase 7.5 - Global Exception Handling va Standard API Response

Da them exception handling dung chung trong `Manga.BuildingBlocks`:

- `AppException`
- `BadRequestException`
- `UnauthorizedException`
- `ForbiddenException`
- `NotFoundException`
- `ConflictException`
- `ValidationException`
- `ExternalServiceException`

Da them response format dung chung:

- `ApiResponse<T>`
- `ApiError`

Da them middleware:

- `GlobalExceptionHandlingMiddleware`
- `UseGlobalExceptionHandling(...)`

Middleware xu ly:

- `AppException`
- FluentValidation exception neu phase sau co cai package
- `DbUpdateException`
- `UnauthorizedAccessException`
- fallback `Exception` thanh HTTP 500

Da gan middleware vao:

- Identity API
- Manga Management API
- File API
- Editorial API

Da chuan hoa controller de success response tra ve `ApiResponse<T>` va error response di qua middleware chung. Controller khong con `try/catch` business exception va khong tra `BadRequest/NotFound/Unauthorized` thu cong cho cac flow hien tai.

Da build solution thanh cong:

```bash
dotnet build MangaSystemPlatform.Server.sln
```

## Phase 8 - Distributed Workflow

Da bien RabbitMQ foundation thanh distributed workflow co consumer xu ly nghiep vu that.

Da cap nhat event contracts de moi integration event co:

- `MessageId`
- `OccurredAt`

Da hoan thien RabbitMQ consumer infrastructure:

- `RabbitMqEventConsumer<TEvent, THandler>`
- Dang ky consumer bang `AddRabbitMqConsumer<TEvent, THandler>(serviceName)`
- Queue naming theo dang `service-name.EventName`
- Ack khi handler xu ly thanh cong
- Nack khong requeue khi handler fail
- Retry handler execution 3 lan
- Log event received, processed va failed
- Neu RabbitMQ chua chay, consumer log warning va khong lam app crash

Da them Inbox Pattern cho:

- Manga Management Service
- Editorial Service

Bang moi:

- `inbox_messages`

Fields:

- `Id`
- `MessageId`
- `EventType`
- `Payload`
- `Status`
- `ReceivedAt`
- `ProcessedAt`
- `Error`

Da them handlers trong Manga Management:

- `FileUploadedEventHandler`
- `ChapterApprovedEventHandler`
- `RankingCalculatedEventHandler`

Da them handlers trong Editorial:

- `TaskAssignedEventHandler`
- `TaskSubmittedEventHandler`
- `ChapterSubmittedForReviewEventHandler`

Workflow da co:

- File upload category `MangaPage` -> Manga Management ghi InboxMessage va log.
- Manga create task -> Editorial ghi InboxMessage va log.
- Manga submit task -> Editorial ghi InboxMessage va log.
- Manga submit chapter for review -> Editorial tao `EditorialReview` neu chua ton tai.
- Editorial approve review -> Manga cap nhat `Chapter.Status = Approved`.
- Editorial calculate ranking -> Manga ghi InboxMessage va log.

Migration da tao:

- `AddInboxMessagesToMangaManagement`
- `AddInboxMessagesToEditorial`

Da build solution thanh cong:

```bash
dotnet build MangaSystemPlatform.Server.sln --no-restore
```
