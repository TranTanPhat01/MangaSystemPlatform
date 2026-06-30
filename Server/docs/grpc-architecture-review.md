# Bao cao ra soat kien truc truoc khi trien khai gRPC

Solution: `MangaSystemPlatform.Server`

Pham vi ra soat dua tren code hien tai:

- `Program.cs` cua gateway va cac service.
- `appsettings.json`, `launchSettings.json`.
- Cac file `.csproj`.
- Controllers cua tung service.
- Shared event contracts trong `shared/Manga.Contracts`.
- RabbitMQ building blocks trong `shared/Manga.BuildingBlocks`.
- `docker-compose.yml`.

Khong thuc hien code trien khai trong bao cao nay.

## 1. Tong quan hien trang

Solution hien tai duoc chia theo huong microservices:

- `gateway/Manga.Gateway`
- `services/identity-service`
- `services/file-service`
- `services/manga-service`
- `services/editorial-service`
- `services/notification-service`
- `shared/Manga.Contracts`
- `shared/Manga.BuildingBlocks`
- `shared/Manga.SharedKernel`

Moi service chinh deu duoc tach thanh 4 layer:

- `.Api`
- `.Application`
- `.Domain`
- `.Infrastructure`

Nhan xet tong quan:

- Cau truc folder/service hien tai hop ly cho Clean Architecture va microservices.
- Moi service co database context rieng trong Infrastructure.
- Gateway dang dung YARP reverse proxy cho REST API.
- Cac service da co JWT authentication, health check, Serilog va Swagger.
- Cross-service async communication da co RabbitMQ thong qua `Manga.Contracts.Events`.
- Chua co cau hinh gRPC hien tai: chua thay `Grpc.AspNetCore`, `Grpc.Net.Client`, `.proto`, `AddGrpc`, `MapGrpcService`.

## 2. Nhan xet kien truc hien tai

### Diem tot

- `Api` chi dong vai tro entrypoint HTTP, dang ky DI, Swagger, auth, health check.
- `Application` chua service nghiep vu va abstraction repository/unit of work.
- `Domain` khong phu thuoc vao Infrastructure.
- `Infrastructure` chua EF Core DbContext, repository implementation va persistence.
- `Manga.Contracts` hien dang dung lam shared event contracts.
- `Manga.BuildingBlocks` chua cross-cutting concerns nhu event bus, health check, exception handling, logging middleware.
- Cac service co database rieng:
  - Identity: `IdentityDb`
  - Manga Management: `MangaDb`
  - File: `FileDb`
  - Editorial: `EditorialDb`
  - Notification: `NotificationDb`

### Diem can canh giac

- `Identity.Api/appsettings.json` dang co `RabbitMQ`, `Redis`, `MinIO`, nhung `Identity.Api/Program.cs` khong dang ky RabbitMQ, Redis hoac MinIO. Nen don cau hinh de tranh hieu nham dependency.
- `Notification` hien da dung event-driven rat phu hop. Khong nen bien Notification thanh dependency sync mac dinh cua cac service khac.
- Khong nen dua generated gRPC client truc tiep vao Application layer. Nen boc qua interface, vi du `IIdentityLookupClient`, roi implement o Infrastructure.
- `Manga.Contracts` hien chi chua events. Neu them proto vao day thi nen to chuc ro trong `Protos` va namespace versioned.

## 3. Trach nhiem tung service

| Service | Trach nhiem hien tai | REST API cho client/gateway | gRPC API noi bo nen expose | Khong nen phu thuoc vao |
|---|---|---|---|---|
| Identity Service | Dang ky, dang nhap, refresh/logout token, user profile, JWT/roles | `/identity/auth/register`, `/identity/auth/login`, `/identity/auth/refresh`, `/identity/auth/logout`, `/identity/users/me` | `CheckUserExists`, `GetUserSummary`, `CheckUserRole` | DB cua service khac, workflow manga/editorial/file |
| File Service | Upload, download, file versions, file metadata/url, file ownership | `/files/upload`, `/files/{fileId}`, `/files/{fileId}/download`, `/files/{fileId}/url`, `/files/{fileId}/versions`, `/files/my` | `FileExists`, `GetFileMetadata`, `GetFileUrl` | Nghiep vu manga/editorial, user DB |
| Manga Management Service | Studios, series, chapters, pages, tasks, annotations | `/manga/studios`, `/manga/series`, `/manga/chapters`, `/manga/pages`, `/manga/tasks`, `/manga/annotations` | `GetSeriesById`, `GetChapterById`, `CheckChapterExists`, `UpdateChapterStatus` | DB Identity/File/Editorial, notification delivery |
| Editorial Service | Editorial reviews, board votes, issues, publication schedules, ranking, cancellation warning | `/editorial/reviews`, `/editorial/issues`, `/editorial/publication-schedules`, `/editorial/series/{seriesId}` | Chi expose khi service khac can query editorial status, vi du `GetReviewStatus` | DB Manga, DB Identity, file storage |
| Notification Service | Quan ly notification cua user, unread count, mark read/delete, consume events | `/notifications/my`, `/notifications/unread-count`, `/notifications/{id}/read`, `/notifications/read-all`, `/notifications/{id}` | `SendNotification` neu thuc su can command sync; mac dinh nen dung message broker | Nghiep vu goc cua manga/editorial/file |

## 4. Bang dependency giua cac service

| Service goi di | Service duoc goi | Use case | Giao thuc de xuat | Ly do |
|---|---|---|---|---|
| Manga Management | Identity | Kiem tra user ton tai khi tao studio member, giao task, validate assignee | gRPC | Validation sync nho, can ket qua ngay truoc khi commit nghiep vu |
| Manga Management | Identity | Lay user summary de hien thi assignee/creator | gRPC hoac cache/read model | Request/response nho; co the cache de giam coupling |
| Manga Management | File | Kiem tra `fileId` khi submit task/page | gRPC | Can dam bao file ton tai truoc khi chap nhan thao tac |
| Manga Management | File | Lay file metadata/url cho page asset | gRPC | Lookup nhanh, khong nen doc DB File truc tiep |
| Editorial | Manga Management | Lay chapter/series summary khi tao review | gRPC | Editorial can tham chieu manga/chapter nhung khong so huu DB manga |
| Editorial | Manga Management | Cap nhat chapter approved/rejected | Message broker uu tien; gRPC chi khi can command sync | Code hien da co `ChapterApprovedEvent`; async propagation phu hop hon |
| Manga Management | Notification | Thong bao task assigned/submitted/approved | Message broker | Notification la side effect, khong nen block workflow chinh |
| Editorial | Notification | Thong bao ket qua review/ranking/cancellation warning | Message broker | Notification nen consume event va tu tao notification |
| File | Manga Management/Notification | File uploaded | Message broker | Code hien da publish `FileUploadedEvent`; async la dung |
| Notification | Cac service khac | Khong nen goi nguoc neu khong can | Khong de xuat | Tranh vong goi va coupling nguoc |

## 5. Use case nen trien khai gRPC

| Use case | gRPC server | gRPC client | Request fields | Response fields | Internal auth | Timeout/retry |
|---|---|---|---|---|---|---|
| `CheckUserExists` | Identity | Manga Management | `user_id` | `exists`, `is_active` | Co | Timeout 1-2s, retry ngan cho loi transient |
| `GetUserSummary` | Identity | Manga Management, Editorial | `user_id` | `user_id`, `display_name`, `email`, `roles`, `is_active` | Co | Timeout 1-2s, cache neu can |
| `CheckUserRole` | Identity | Manga Management, Editorial | `user_id`, `role` | `has_role` | Co | Timeout 1-2s |
| `FileExists` | File | Manga Management | `file_id` | `exists`, `category`, `content_type` | Co | Timeout 1-2s |
| `GetFileMetadata` | File | Manga Management, Editorial | `file_id` | `file_id`, `file_name`, `content_type`, `size`, `category`, `url` | Co | Timeout 1-2s |
| `GetMangaById` / `GetSeriesById` | Manga Management | Editorial | `series_id` | `series_id`, `title`, `status`, `author_user_id` | Co | Timeout 2s |
| `GetChapterById` | Manga Management | Editorial | `chapter_id` | `chapter_id`, `series_id`, `title`, `number`, `status` | Co | Timeout 2s |
| `UpdateMangaStatus` / `UpdateChapterStatus` | Manga Management | Editorial | `chapter_id`, `status`, `reason`, `updated_by_user_id` | `success`, `current_status` | Co | Can nhac event thay vi retry command |
| `SendNotification` | Notification | Manga Management, Editorial | `user_id`, `type`, `title`, `message`, `metadata` | `notification_id`, `created_at` | Co | Chi retry neu idempotent |

Flow dau tien nen lam:

```text
Manga.Management.Api
  -> IIdentityLookupClient trong Application
    -> IdentityGrpcClient implementation trong Infrastructure
      -> Manga.Identity.Api gRPC server
        -> Identity Application/UserRepository
```

## 6. Vi tri dat proto files

### Phuong an A: dat proto trong tung project `.Api`

Uu diem:

- Service owner thay proto gan voi API implementation.
- Don gian neu chi co mot client.

Nhuoc diem:

- Client service phai reference Api project hoac copy proto.
- De tao dependency sai chieu, vi Application/Infrastructure service khac co the bi keo vao `.Api`.
- Kho quan ly version khi nhieu service cung dung.
- Proto bi phan tan.

### Phuong an B: tao shared contracts project

Uu diem:

- Tap trung contract noi bo.
- Server va client cung generate tu mot nguon.
- Khong can reference Api layer cua service khac.
- Phu hop voi solution da co `shared/Manga.Contracts`.

Nhuoc diem:

- Can quan ly version contract nghiem tuc.
- Shared project co nguy co phinh to neu dua ca DTO/entity noi bo vao.

### De xuat

Chon phuong an B.

Vi solution hien da co `shared/Manga.Contracts`, nen co 2 cach:

1. Dung luon `shared/Manga.Contracts` va them folder `Protos`.
2. Doi/tao moi thanh `shared/Manga.Shared.Contracts` neu muon ten ro hon.

Khuyen nghi thuc te: dung `shared/Manga.Contracts` hien co, vi project nay dang la shared contract cho event. Them:

```text
shared/Manga.Contracts/
  Events/
  Protos/
    identity.proto
    file.proto
    manga.proto
    editorial.proto
    notification.proto
```

Can tranh tao song song `Manga.Contracts` va `Manga.Shared.Contracts` neu hai project cung lam mot viec.

## 7. Danh sach proto ban dau

### `identity.proto`

- `package`: `manga.identity.v1`
- `csharp_namespace`: `Manga.Contracts.Identity.V1`
- `service`: `IdentityGrpcService`
- RPC:
  - `CheckUserExists(CheckUserExistsRequest) returns (CheckUserExistsResponse)`
  - `GetUserSummary(GetUserSummaryRequest) returns (GetUserSummaryResponse)`
  - `CheckUserRole(CheckUserRoleRequest) returns (CheckUserRoleResponse)`

Message co ban:

```proto
message CheckUserExistsRequest {
  string user_id = 1;
}

message CheckUserExistsResponse {
  bool exists = 1;
  bool is_active = 2;
}

message GetUserSummaryRequest {
  string user_id = 1;
}

message GetUserSummaryResponse {
  string user_id = 1;
  string display_name = 2;
  string email = 3;
  repeated string roles = 4;
  bool is_active = 5;
}

message CheckUserRoleRequest {
  string user_id = 1;
  string role = 2;
}

message CheckUserRoleResponse {
  bool has_role = 1;
}
```

### `file.proto`

- `package`: `manga.file.v1`
- `csharp_namespace`: `Manga.Contracts.File.V1`
- `service`: `FileGrpcService`
- RPC:
  - `FileExists(FileExistsRequest) returns (FileExistsResponse)`
  - `GetFileMetadata(GetFileMetadataRequest) returns (GetFileMetadataResponse)`
  - `GetFileUrl(GetFileUrlRequest) returns (GetFileUrlResponse)`

Message co ban:

```proto
message FileExistsRequest {
  string file_id = 1;
}

message FileExistsResponse {
  bool exists = 1;
  string category = 2;
  string content_type = 3;
}

message GetFileMetadataRequest {
  string file_id = 1;
}

message GetFileMetadataResponse {
  string file_id = 1;
  string file_name = 2;
  string content_type = 3;
  int64 size = 4;
  string category = 5;
  string url = 6;
}
```

### `manga.proto`

- `package`: `manga.management.v1`
- `csharp_namespace`: `Manga.Contracts.Management.V1`
- `service`: `MangaManagementGrpcService`
- RPC:
  - `GetSeriesById(GetSeriesByIdRequest) returns (GetSeriesByIdResponse)`
  - `GetChapterById(GetChapterByIdRequest) returns (GetChapterByIdResponse)`
  - `CheckChapterExists(CheckChapterExistsRequest) returns (CheckChapterExistsResponse)`
  - `UpdateChapterStatus(UpdateChapterStatusRequest) returns (UpdateChapterStatusResponse)`

Message co ban:

```proto
message GetSeriesByIdRequest {
  string series_id = 1;
}

message GetSeriesByIdResponse {
  string series_id = 1;
  string title = 2;
  string status = 3;
}

message GetChapterByIdRequest {
  string chapter_id = 1;
}

message GetChapterByIdResponse {
  string chapter_id = 1;
  string series_id = 2;
  string title = 3;
  int32 number = 4;
  string status = 5;
}

message UpdateChapterStatusRequest {
  string chapter_id = 1;
  string status = 2;
  string reason = 3;
  string updated_by_user_id = 4;
}

message UpdateChapterStatusResponse {
  bool success = 1;
  string current_status = 2;
}
```

### `editorial.proto`

- `package`: `manga.editorial.v1`
- `csharp_namespace`: `Manga.Contracts.Editorial.V1`
- `service`: `EditorialGrpcService`
- RPC de xuat toi thieu:
  - `GetReviewStatus(GetReviewStatusRequest) returns (GetReviewStatusResponse)`

Luu y: chua nen them nhieu RPC cho Editorial neu chua co client noi bo can dung.

### `notification.proto`

- `package`: `manga.notification.v1`
- `csharp_namespace`: `Manga.Contracts.Notification.V1`
- `service`: `NotificationGrpcService`
- RPC:
  - `SendNotification(SendNotificationRequest) returns (SendNotificationResponse)`

Luu y: chi dung RPC nay neu co use case can sync. Voi cac event dang co, Notification nen tiep tuc consume RabbitMQ.

## 8. Cau hinh can chuan bi

### NuGet packages

Shared contracts:

- `Google.Protobuf`
- `Grpc.Tools`

gRPC server `.Api`:

- `Grpc.AspNetCore`

gRPC client:

- `Grpc.Net.Client`
- Co the them resilience package neu can timeout/retry policy.

### `.csproj`

Trong `shared/Manga.Contracts.csproj`, them proto item theo role phu hop:

- `GrpcServices="Server"` cho proto cua service server neu project server reference contract.
- `GrpcServices="Client"` cho client.
- Hoac `GrpcServices="Both"` neu muon project shared generate ca base server va client.

Can thong nhat cach generate de tranh duplicate type.

### `Program.cs`

Service server, vi du Identity:

- `builder.Services.AddGrpc();`
- `app.MapGrpcService<IdentityGrpcServiceImplementation>();`

Service client, vi du Manga Management:

- Dang ky typed gRPC client trong Infrastructure.
- Boc generated client qua interface `IIdentityLookupClient`.
- Application chi goi interface.

### `appsettings.json`

Them section noi bo:

```json
{
  "Grpc": {
    "Identity": {
      "Address": "http://localhost:6207",
      "TimeoutSeconds": 2
    },
    "File": {
      "Address": "http://localhost:6154",
      "TimeoutSeconds": 2
    }
  }
}
```

### Port local hien tai

Theo `launchSettings.json` va gateway config:

| Component | REST port hien tai |
|---|---|
| Gateway | `5200` |
| Identity | `5207` |
| Manga Management | `5078` |
| File | `5154` |
| Editorial | `5206` |
| Notification | `5210` |

Port gRPC de xuat:

| Service | gRPC port de xuat |
|---|---|
| Identity | `6207` |
| Manga Management | `6078` |
| File | `6154` |
| Editorial | `6206` |
| Notification | `6210` |

### HTTP/2

Can cau hinh Kestrel endpoint cho gRPC dung HTTP/2. Neu chay local khong TLS voi HTTP/2, can test ky vi .NET client/server co yeu cau rieng tuy moi truong.

### Docker/local

`docker-compose.yml` hien moi chay infrastructure:

- PostgreSQL
- RabbitMQ
- Redis
- MinIO
- Seq

Neu containerize app services, can expose ca REST va gRPC ports, dong thoi dat service discovery/address theo container network thay vi localhost.

### Logging va health check

- Tiep tuc dung Serilog/Seq.
- Log gRPC method, deadline, status code, peer address, correlation id neu co.
- Giu `/health` cho REST health.
- Co the them gRPC health check neu can kiem tra tu service mesh/tooling.

## 9. Roadmap trien khai an toan

### Buoc 1: Chon flow don gian nhat

Chon:

```text
Manga.Management.Api -> Manga.Identity.Api: CheckUserExists
```

Ap dung khi tao task, add studio member, hoac bat ky flow nao can validate `userId`.

### Buoc 2: Tao shared contracts

- Them `identity.proto` vao `shared/Manga.Contracts/Protos`.
- Them package `Google.Protobuf`, `Grpc.Tools`.
- Build solution de dam bao generated code ok.

### Buoc 3: Cau hinh gRPC server o Identity

- Cai `Grpc.AspNetCore`.
- Tao implementation service trong Identity Api hoac folder `GrpcServices`.
- Map `CheckUserExists`.
- Khong expose qua gateway cho frontend.

### Buoc 4: Cau hinh gRPC client o Manga Management

- Cai `Grpc.Net.Client`.
- Them config `Grpc:Identity:Address`.
- Tao `IIdentityLookupClient` trong Application.
- Implement client trong Infrastructure.

### Buoc 5: Test bang log

- Log request tu Manga sang Identity.
- Log response exists/not exists.
- Test timeout khi Identity down.
- Test invalid user id.

### Buoc 6: Refactor Application layer

- Manga Application chi phu thuoc `IIdentityLookupClient`.
- Khong reference `Manga.Identity.Api`.
- Khong inject generated gRPC client vao Application service.

### Buoc 7: Mo rong dan

Thu tu de xuat:

1. `CheckUserExists`
2. `GetUserSummary`
3. `FileExists`
4. `GetFileMetadata`
5. `GetChapterById` cho Editorial
6. Chi can nhac command RPC nhu `UpdateChapterStatus` sau khi da ro transaction/idempotency

## 10. Cac loi kien truc can tranh

- Frontend goi truc tiep gRPC noi bo.
- Copy toan bo REST API sang gRPC.
- Service truy cap truc tiep database cua service khac.
- Application layer reference Api layer.
- Domain layer phu thuoc Infrastructure.
- Dung chung EF entity/database entity giua cac service.
- Dat proto rai rac trong nhieu `.Api` project.
- Khong cau hinh HTTP/2.
- Khong co timeout/deadline.
- Retry command khong idempotent gay double-write.
- Goi vong tron giua cac service, vi du Manga sync goi Editorial, Editorial sync goi lai Manga.
- Dung gRPC cho notification side effect trong khi event broker da phu hop hon.

## 11. So do luong goi service

Hien tai:

```text
Client
  -> Gateway REST
    -> Identity REST
    -> Manga REST
    -> File REST
    -> Editorial REST
    -> Notification REST

File
  -> RabbitMQ: FileUploadedEvent

Manga Management
  -> RabbitMQ: TaskAssignedEvent, TaskSubmittedEvent, TaskApprovedEvent, ChapterSubmittedForReviewEvent
  <- RabbitMQ: FileUploadedEvent, ChapterApprovedEvent, RankingCalculatedEvent

Editorial
  <- RabbitMQ: TaskAssignedEvent, TaskSubmittedEvent, ChapterSubmittedForReviewEvent
  -> RabbitMQ: ChapterApprovedEvent, RankingCalculatedEvent, CancellationWarningCreatedEvent

Notification
  <- RabbitMQ: TaskAssignedEvent, TaskSubmittedEvent, TaskApprovedEvent,
               ChapterSubmittedForReviewEvent, ChapterApprovedEvent,
               RankingCalculatedEvent, CancellationWarningCreatedEvent,
               FileUploadedEvent
```

Sau khi them gRPC:

```text
Client
  -> Gateway REST
    -> Public REST APIs

Manga Management
  -> Identity gRPC: CheckUserExists, GetUserSummary
  -> File gRPC: FileExists, GetFileMetadata
  -> RabbitMQ: workflow/domain events

Editorial
  -> Manga Management gRPC: GetChapterById, GetSeriesById
  -> RabbitMQ: review/ranking events

Notification
  <- RabbitMQ events
```

## 12. Checklist truoc khi trien khai

- [ ] Thong nhat vi tri proto: de xuat `shared/Manga.Contracts/Protos`.
- [ ] Thong nhat package naming va versioning: `manga.<service>.v1`.
- [ ] Them NuGet packages cho shared/server/client.
- [ ] Them port gRPC rieng cho tung service.
- [ ] Cau hinh Kestrel HTTP/2.
- [ ] Them config service address trong `appsettings`.
- [ ] Them timeout/deadline cho client calls.
- [ ] Them internal auth cho gRPC.
- [ ] Them logging cho gRPC calls.
- [ ] Dam bao Application layer chi phu thuoc interface.
- [ ] Khong reference Api project cua service khac.
- [ ] Test service down/timeout.
- [ ] Test invalid request/not found.
- [ ] Giu RabbitMQ cho notification va workflow async.

## 13. Ket luan va khuyen nghi

Kien truc hien tai da co nen tang tot de them gRPC theo tung buoc nho. Khong nen thay the RabbitMQ bang gRPC. Nen dung:

- REST cho client/gateway.
- gRPC cho lookup/validation noi bo can ket qua ngay.
- RabbitMQ cho event, notification, workflow propagation va side effects.

Flow nen trien khai dau tien la:

```text
Manga.Management.Api -> Manga.Identity.Api: CheckUserExists
```

Day la flow gon, it rui ro, de test, va giup dat mau chuan cho cac gRPC client/server tiep theo.
