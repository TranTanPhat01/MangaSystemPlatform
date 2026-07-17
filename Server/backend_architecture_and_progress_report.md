# Báo cáo kiến trúc và tiến độ Backend

**Dự án:** Manga Creation Workflow and Publishing Management System  
**Phạm vi rà soát:** thư mục `Server`, chỉ đọc mã nguồn và cấu hình  
**Thời điểm:** 13/07/2026  
**Nhánh đang rà soát:** `feature/mvp`  
**Lưu ý:** worktree có thay đổi chưa commit sẵn có ở `docker-compose.yml`, một số controller/appsettings và phía Client. Báo cáo phản ánh trạng thái mã nguồn hiện tại; không có migration, database hay mã nguồn nào bị thay đổi trong quá trình audit.

## Executive Summary

Backend đã có nền tảng tốt cho MVP: .NET 8, 5 service nghiệp vụ, YARP Gateway, tách đủ Api/Application/Domain/Infrastructure, PostgreSQL database-per-service ở mức logical, RabbitMQ publisher/consumer, Inbox idempotency, JWT role-based authorization, MinIO adapter và SignalR notification. Solution build thành công, 36/36 test hiện có pass.

Mức độ hoàn thiện nên được đánh giá là **MVP kỹ thuật đang ở giai đoạn tích hợp, chưa production-ready**. Các luồng chính đã có API và domain persistence, nhưng còn các khoảng trống P0: kiểm soát ownership/data scope chưa nhất quán, không có Outbox/DLQ nên event có thể mất, File Service mặc định vẫn lưu local thay vì MinIO, Docker Compose chưa chạy các API, và role/endpoint cho người đọc bỏ phiếu chưa được mô hình hóa đúng. CRUD của Series/Chapter/Page/Annotation cũng chưa đủ theo nghĩa CRUD chuẩn.

## Current Backend Architecture

```text
Client
  -> YARP Gateway (: gateway routes /identity, /manga, /files, /editorial, /notifications)
       -> Identity / Manga Management / File / Editorial / Notification APIs
            -> PostgreSQL databases (mỗi service một database)
            -> RabbitMQ topic exchange: manga-system-events
            -> gRPC nội bộ (Identity, Manga, File)
            -> File storage (Local mặc định, có MinIO provider)
            -> SignalR hub tại Notification Service

Shared: BuildingBlocks, Contracts, SharedKernel
Infrastructure: PostgreSQL, RabbitMQ, Redis, MinIO, Seq
```

Đây là kiến trúc microservice ở mức source code và database ownership. Các service không tham chiếu trực tiếp DbContext của nhau; sự tích hợp dùng shared event contracts, RabbitMQ và một số gRPC endpoint. Tuy nhiên, việc tất cả API chạy bằng process local và Docker Compose chỉ có hạ tầng khiến mô hình containerized microservices chưa hoàn chỉnh.

## Service Inventory

| Service/project | Layers | HTTP API | Database ownership | Nhận xét |
|---|---|---|---|---|
| `Manga.Identity` | Api, Application, Domain, Infrastructure | Có | `IdentityDB` | Đủ layer; JWT, refresh token, role admin/user. |
| `Manga.Management` | Api, Application, Domain, Infrastructure | Có | `MangaManagementDB` | Đủ layer; studio, series, chapter, page, task, submission. |
| `Manga.File` | Api, Application, Domain, Infrastructure | Có | `FileServiceDB` | Đủ layer; metadata/version/thumbnail entity; local storage là mặc định. |
| `Manga.Editorial` | Api, Application, Domain, Infrastructure | Có | `EditorialDB` | Đủ layer; review, vote, issue, ranking, schedule. |
| `Manga.Notification` | Api, Application, Domain, Infrastructure | Có | `NotificationDB` | Đủ layer; inbox và SignalR hub. |
| `Manga.Gateway` | API Gateway | Có | Không có | YARP proxy, health aggregation. |
| `Manga.BuildingBlocks`, `Manga.Contracts`, `Manga.SharedKernel` | Shared libraries | Không | Không | Shared middleware, messaging, contracts và primitives. |

Solution duy nhất là `MangaSystemPlatform.Server.sln`, gồm 24 project: Gateway (1), 5 service x 4 layer (20), 3 shared project và 1 test project (`MangaSystemPlatform.GrpcIntegrationTests`). Không có service nào thiếu layer Clean Architecture theo cấu trúc project. Điểm cần theo dõi là shared BuildingBlocks/Contracts có thể trở thành coupling nếu domain contract tăng nhanh; hiện tại vẫn chấp nhận được cho MVP.

## Infrastructure and Docker

| Container | Host port -> container port | Healthcheck | Ghi chú |
|---|---:|---|---|
| PostgreSQL 16 | `5433 -> 5432` | `pg_isready` | Khởi tạo database bằng `infrastructure/postgres/init-databases.sql`. |
| RabbitMQ management | `5672 -> 5672`, `15672 -> 15672` | `rabbitmq-diagnostics ping` | Dùng exchange topic. |
| Redis 7 | `6379 -> 6379` | `redis-cli ping` | AOF được bật. |
| MinIO | `9000 -> 9000`, `9001 -> 9001` | `/minio/health/live` | Có persistent volume. |
| Seq | `5341 -> 80` | Không có | Thu thập log Serilog. |

`docker-compose.yml` không định nghĩa container cho Gateway hay 5 API. Vì vậy `depends_on`, healthcheck liên service, network address theo service name và cấu hình production trong container chưa được kiểm chứng. Các API hiện cấu hình downstream/infra chủ yếu bằng `localhost`, phù hợp chạy local nhưng không phù hợp khi đưa chính API vào container.

Rủi ro cấu hình:

- Có development secret/password mặc định trong `appsettings.json` và docker-compose (JWT, PostgreSQL, RabbitMQ, MinIO, Seq). Không được dùng nguyên trạng ở môi trường dùng chung/production.
- RabbitMQ đang để `guest/guest`; MinIO/Seq cũng có mật khẩu mặc định rõ ràng.
- Seq không có healthcheck.
- File, Editorial và Notification API không tự cấu hình CORS; Gateway có CORS cho hai origin local. Nếu frontend gọi trực tiếp service thì có khả năng bị chặn CORS.

## Database and Migration Status

| Owner | DbContext | Database | Entity chính | Migrations hiện có |
|---|---|---|---|---|
| Identity | `IdentityDbContext` | `IdentityDB` | User, Role, UserRole, RefreshToken | `20260518023035_InitialIdentity` |
| Manga | `MangaManagementDbContext` | `MangaManagementDB` | Studio, StudioMember, Series, Chapter, Page, Annotation, MangaTask, Submission, Revision, InboxMessage | `20260518145056_InitialMangaManagement`; `20260520123159_AddInboxMessagesToMangaManagement`; `20260707171228_AddProgressAndAnnotationDescription` |
| File | `FileDbContext` | `FileServiceDB` | FileAsset, FileVersion, Thumbnail | `20260519065917_InitialFileService` |
| Editorial | `EditorialDbContext` | `EditorialDB` | EditorialReview, EditorialComment, BoardVote, Issue, PublicationSchedule, ReaderVote, RankingSnapshot, RankingItem, CancellationWarning, InboxMessage | `20260520021425_InitialEditorialService`; `20260520131121_AddInboxMessagesToEditorial` |
| Notification | `NotificationDbContext` | `NotificationDB` | Notification, InboxMessage | `20260521030024_InitialNotificationService` |

Đủ các entity cốt lõi được yêu cầu, ngoại trừ `InboxMessage` chỉ tồn tại ở Manga/Editorial/Notification (đúng với các consumer hiện có). Không thực hiện `dotnet ef database update` trong audit. `Submission` tồn tại trong Manga Management, nhưng không có controller/resource độc lập; nó đang được tạo qua thao tác submit task.

## API Endpoint Inventory

Tất cả response controller được bọc `ApiResponse<T>` hoặc kết quả file download. Cột Auth ghi `JWT` vì controller/method có `[Authorize]`; role trong ngoặc là giới hạn bổ sung. Status đánh giá theo mã nguồn, không phải kiểm thử E2E.

| Service | Controller | Method | Route | Auth | Request -> response | Status |
|---|---|---|---|---|---|---|
| Identity | Auth | POST | `/identity/auth/register` | No | `RegisterRequest -> AuthResponse` | Implemented |
| Identity | Auth | POST | `/identity/auth/login` | No | `LoginRequest -> AuthResponse` | Implemented |
| Identity | Auth | POST | `/identity/auth/refresh` | No | `RefreshTokenRequest -> AuthResponse` | Implemented |
| Identity | Auth | POST | `/identity/auth/logout` | No | `RefreshTokenRequest -> message` | Implemented |
| Identity | Users | GET | `/identity/users/me` | JWT | `- -> UserProfileResponse` | Implemented |
| Identity | Users | GET | `/identity/users` | JWT (Admin) | `- -> AdminUserResponse[]` | Implemented |
| Identity | Users | PATCH | `/identity/users/{id}/status` | JWT (Admin) | `UpdateUserStatusRequest -> AdminUserResponse` | Implemented |
| Identity | Users | PUT | `/identity/users/{id}/roles` | JWT (Admin) | `UpdateUserRolesRequest -> AdminUserResponse` | Implemented |
| Manga | Studios | POST | `/manga/studios` | JWT (Mangaka/Admin) | `CreateStudioRequest -> StudioResponse` | Implemented |
| Manga | Studios | GET | `/manga/studios/my`, `/{id}` | JWT | `- -> StudioResponse` | Partial: scope ownership cần xác nhận kỹ |
| Manga | Series | POST | `/manga/series` | JWT (Mangaka/Admin) | `CreateSeriesRequest -> SeriesResponse` | Implemented |
| Manga | Series | GET | `/manga/series`, `/{id}` | JWT | `- -> SeriesResponse` | Partial: không có lọc/paging/data scope |
| Manga | Series | PATCH | `/manga/series/{id}` | JWT (Mangaka/Admin) | `UpdateSeriesRequest -> SeriesResponse` | Partial: không có DELETE, ownership chưa thấy ở endpoint |
| Manga | Series | POST | `/{id}/submit-proposal`, `/{id}/approve-proposal`, `/{id}/reject-proposal` | JWT (Mangaka/Board/Admin) | `-` / `SeriesDecisionRequest -> SeriesResponse` | Implemented |
| Manga | Series | POST/GET | `/{seriesId}/chapters` | JWT (POST Mangaka/Admin) | `CreateChapterRequest -> ChapterResponse` | Partial: không có delete/chapter update đầy đủ |
| Manga | Chapters | GET | `/manga/chapters/{id}` | JWT | `- -> ChapterResponse` | Implemented |
| Manga | Chapters | PATCH | `/{id}/status` | JWT (Mangaka/TantouEditor/Admin) | `UpdateChapterStatusRequest -> ChapterResponse` | Partial: status-only update |
| Manga | Chapters | POST | `/{id}/submit-review` | JWT (Mangaka/Admin) | `- -> ChapterResponse` | Implemented |
| Manga | Chapters | POST/GET | `/{id}/pages` | JWT (POST Mangaka/Assistant/Admin) | `CreatePageRequest -> PageResponse[]` | Partial: page CRUD chưa đủ |
| Manga | Pages | GET | `/manga/pages/{id}` | JWT | `- -> PageResponse` | Implemented |
| Manga | Pages | PATCH | `/{id}/status` | JWT (Mangaka/Assistant/Admin) | `UpdatePageStatusRequest -> PageResponse` | Partial: status-only update |
| Manga | Pages | POST/GET | `/{id}/annotations` | JWT (POST Mangaka/TantouEditor/Admin) | `CreateAnnotationRequest -> AnnotationResponse[]` | Partial: không update annotation |
| Manga | Annotations | DELETE | `/manga/annotations/{id}` | JWT (Mangaka/TantouEditor/Admin) | `- -> message` | Partial: chỉ delete resource route |
| Manga | Tasks | POST | `/manga/tasks` | JWT (Mangaka/Admin) | `CreateTaskRequest -> TaskResponse` | Implemented |
| Manga | Tasks | GET | `/manga/tasks/my`, `/{id}` | JWT | `- -> TaskResponse` | Partial: ownership/data scope cần harden |
| Manga | Tasks | POST | `/{id}/start`, `/{id}/submit`, `/{id}/approve`, `/{id}/request-revision` | JWT (Assistant hoặc Mangaka/Admin) | `SubmitTaskRequest`/`RequestRevisionRequest -> TaskResponse` | Implemented |
| File | Files | POST | `/files/upload` | JWT (Mangaka/Assistant/Admin) | `multipart FileUploadFormRequest -> FileAssetResponse` | Implemented |
| File | Files | GET | `/files/{id}`, `/download`, `/url`, `/versions`, `/my` | JWT | `- -> metadata/stream/url/version[]` | Partial: read/download không giới hạn theo owner/role cụ thể |
| File | Files | POST | `/files/{id}/versions` | JWT (Mangaka/Assistant/Admin) | `multipart FileVersionUploadFormRequest -> FileVersionResponse` | Implemented |
| File | Files | DELETE | `/files/{id}` | JWT (Mangaka/Admin) | `- -> message` | Partial: ownership cần kiểm tra tại service |
| Editorial | Reviews | POST/GET | `/editorial/reviews`, `/{id}` | JWT (POST Mangaka/TantouEditor/Admin) | `CreateEditorialReviewRequest -> EditorialReviewResponse` | Implemented |
| Editorial | Reviews | POST/GET | `/{id}/comments` | JWT (POST TantouEditor/Admin) | `CreateEditorialCommentRequest -> comment[]` | Implemented |
| Editorial | Reviews | POST | `/{id}/approve`, `/request-revision`, `/reject` | JWT (TantouEditor/Admin) | `DecisionRequest -> EditorialReviewResponse` | Implemented |
| Editorial | BoardVotes | POST/GET | `/editorial/series/{seriesId}/votes`, `/vote-summary` | JWT (POST Board/Admin) | `BoardVoteRequest -> vote/summary` | Implemented |
| Editorial | BoardVotes | POST | `/{seriesId}/hiatus`, `/cancel` | JWT (Board/Admin) | `- -> publication status` | Implemented |
| Editorial | BoardVotes | GET | `/{seriesId}/ranking-history`, `/cancellation-warnings` | JWT | `- -> ranking/warnings` | Implemented |
| Editorial | Issues | POST/GET | `/editorial/issues`, `/{id}` | JWT (POST Board/Admin) | `CreateIssueRequest -> IssueResponse` | Implemented |
| Editorial | Issues | PATCH | `/{id}/status` | JWT (Board/Admin) | `UpdateIssueStatusRequest -> IssueResponse` | Implemented |
| Editorial | Issues | POST/GET | `/{id}/reader-votes` | JWT (**POST Board/Admin**) | `ReaderVoteRequest -> vote[]` | Partial: reader không thể bỏ phiếu theo policy hiện tại |
| Editorial | Issues | POST/GET | `/{id}/calculate-ranking`, `/rankings` | JWT (POST Board/Admin) | `- -> ranking` | Implemented |
| Editorial | PublicationSchedules | POST/GET | `/editorial/publication-schedules`, `/{id}` | JWT (POST Board/Admin) | `CreatePublicationScheduleRequest -> schedule` | Implemented |
| Editorial | PublicationSchedules | POST | `/{id}/publish` | JWT (Board/Admin) | `- -> schedule` | Implemented |
| Notification | Notifications | GET | `/notifications/my`, `/unread-count` | JWT | `- -> NotificationResponse[]/UnreadCountResponse` | Implemented |
| Notification | Notifications | POST | `/{id}/read`, `/read-all` | JWT | `- -> NotificationResponse/UnreadCountResponse` | Implemented |
| Notification | Notifications | DELETE | `/{id}` | JWT | `- -> message` | Implemented |
| Notification | SignalR | WebSocket | `/notifications/hub` | JWT query `access_token` | event `NotificationReceived` | Implemented, chưa có E2E test |

## Authentication and Authorization Status

JWT bearer được cấu hình ở Identity, Manga, File, Editorial và Notification, kiểm tra issuer, audience, lifetime và signing key; `ClockSkew = 0`. Identity phát hành role claims và seed 5 role: `Mangaka`, `Assistant`, `TantouEditor`, `EditorialBoard`, `Admin`.

`Admin` là role quản trị hệ thống, không phải một trong bốn role nghiệp vụ chính. Policy `AdminOnly` bảo vệ danh sách user, đổi trạng thái user và thay role. Các controller nghiệp vụ đều có `[Authorize]`; mutating endpoints phần lớn đã gắn role giới hạn.

Các điểm cần xử lý:

- Authorization hiện chủ yếu RBAC tại controller. Cần xác nhận và bổ sung ABAC/ownership tại application service: Mangaka chỉ sửa series/chapter/task/studio của mình; Assistant chỉ submit task được assign; Editor chỉ xử lý review được giao; user chỉ tải file/notification thuộc phạm vi của mình.
- GET collection/detail của Manga, Editorial và File có thể trả dữ liệu rộng hơn phạm vi cần thiết vì controller chỉ yêu cầu JWT chung.
- Không có role `Reader`; endpoint thêm reader vote lại giới hạn `EditorialBoard,Admin`. Đây là lệch trực tiếp với nghiệp vụ Reader Voting.
- JWT secret và internal gRPC API key đang đặt trong file cấu hình development.

## RabbitMQ and Event Flow Status

**Contract đã có:** `FileUploadedEvent`, `TaskAssignedEvent`, `TaskSubmittedEvent`, `TaskApprovedEvent`, `ChapterSubmittedForReviewEvent`, `ChapterApprovedEvent`, `RankingCalculatedEvent`, `CancellationWarningCreatedEvent`. Không có `NotificationCreatedEvent`; Notification Service tạo notification trực tiếp khi consume các event trên.

Publisher/consumer dùng exchange topic durable `manga-system-events`; routing key là tên CLR của event. Queue theo mẫu `{service}.{EventName}`. Consumer manual-ack, prefetch 1, retry tối đa 3 lần và `BasicNack(requeue: false)` khi cuối cùng thất bại.

| Event | Publisher | Consumer | Xử lý |
|---|---|---|---|
| FileUploaded | File | Manga, Notification | Manga handler hiện chủ yếu log/đánh dấu Inbox; Notification tạo thông báo. |
| TaskAssigned | Manga | Editorial, Notification | Editorial ghi Inbox; Notification tạo thông báo. |
| TaskSubmitted | Manga | Editorial, Notification | Editorial ghi Inbox; Notification tạo thông báo. |
| TaskApproved | Manga | Notification | Tạo thông báo. |
| ChapterSubmittedForReview | Manga | Editorial, Notification | Editorial tạo/chuẩn bị review; Notification tạo thông báo. |
| ChapterApproved | Editorial | Manga, Notification | Manga đánh dấu chapter Approved; Notification tạo thông báo. |
| RankingCalculated | Editorial | Manga, Notification | Manga handler lưu Inbox/log; Notification tạo thông báo. |
| CancellationWarningCreated | Editorial | Notification | Tạo thông báo. |

Inbox Pattern có thật tại Manga, Editorial và Notification bằng `MessageId`/status/processed time. Tuy nhiên chưa có Outbox Pattern, không có dead-letter exchange/queue, không có publisher confirm và `RabbitMqEventBus.PublishAsync` bắt exception rồi chỉ ghi warning. Nếu DB transaction đã commit nhưng publish thất bại, trạng thái có thể không phát event mà caller vẫn nhận thành công. Đây là P0 cho workflow bất đồng bộ.

## File Storage Status

File upload/version dùng `multipart/form-data`, lưu `FileAsset`/`FileVersion`/`Thumbnail` metadata trong `FileServiceDB`, có download stream, URL endpoint và version history. Có hai implementation storage: `LocalFileStorageService` và `MinioFileStorageService`; MinIO adapter có tạo bucket và public object URL.

Tuy nhiên `FileStorage.Provider` và `Storage.Provider` trong cấu hình hiện tại đều là `Local`, nên binary mặc định đang lưu tại `storage/files`, không phải MinIO. Entity `Thumbnail` có trong database nhưng không thấy worker/flow tạo thumbnail từ file upload. Download/URL/metadata có JWT nhưng chưa thể hiện rõ ownership authorization ở controller; cần kiểm tra/harden ở service trước khi mở rộng người dùng.

## Notification and SignalR Status

Notification Service có đủ `/notifications/my`, unread count, mark-one-read, mark-all-read và delete. Các event handler dùng Inbox để chống xử lý trùng. Sau khi tạo notification, `SignalRNotificationRealtimePublisher` gửi `NotificationReceived` tới `Clients.User(notification.UserId.ToString())`; hub là `/notifications/hub`, yêu cầu JWT và hỗ trợ token query-string cho SignalR.

Phần này là **implemented theo mã nguồn**, nhưng mới là partial ở mức vận hành vì chưa có test kết nối WebSocket thực tế, retry/persistence cho realtime delivery, hay scale-out backplane (Redis SignalR) khi chạy nhiều instance.

## MVP Gap Analysis

| Module | Kỳ vọng | Current backend status | Frontend status | Gap | Priority | Next action |
|---|---|---|---|---|---|---|
| Authentication & User Management | Register/login/refresh/me, quản trị user/role | Có | Không audit chi tiết | Secrets dev, chưa có test API auth/security | P1 | Secret store/env, test auth matrix, audit revoke/refresh. |
| Series Management | CRUD và proposal decision | Create/read/update + proposal workflow | Không audit chi tiết | Không DELETE, ownership/filter/paging chưa rõ | P0 | Enforce owner, thêm CRUD thiếu theo BRD, test role. |
| Chapter Management | CRUD, progress, submit review | Create/read/status/progress/submit | Không audit chi tiết | Không update/delete đầy đủ; data scope | P0 | Hoàn thiện command/query và ownership. |
| Page & Manuscript | CRUD pages và file link | Create/read/status | Không audit chi tiết | Không update/delete page; liên kết file/event còn mỏng | P0 | Hoàn thiện CRUD và mapping file-to-page. |
| Annotation | CRUD annotation | Create/list/delete | Không audit chi tiết | Thiếu update; access scope | P1 | Bổ sung update và policy ownership/editor assignment. |
| Task & Submission | Assign/start/submit/review/revision | Có qua Task/Submission entity | Không audit chi tiết | Không có Submission API/resource độc lập; validation ownership | P0 | Quyết định API boundary, test full workflow. |
| File Management | Upload/download/meta/version/thumbnail MinIO | Có upload/version/download/meta | Không audit chi tiết | Local provider mặc định, thumbnail chưa sinh, access scope | P0 | Chuyển env deployment sang MinIO, thumbnail worker, authorization. |
| Editorial Review | Review/comment/approve/revision/reject | Có | Không audit chi tiết | Assignment/scope editor chưa rõ | P1 | Enforce assigned editor and E2E review flow. |
| Editorial Board & Decision | Board vote, publish/hiatus/cancel | Có | Không audit chi tiết | Thiếu evidence voting quorum/audit logic | P1 | Verify business rules, add tests/audit trail. |
| Reader Voting & Ranking | Reader cast vote; ranking | Ranking có | Không audit chi tiết | Endpoint cast vote chỉ Board/Admin, không có Reader role | P0 | Thiết kế Reader identity/authorization và chỉnh API policy. |
| Notification Center | Inbox + real-time SignalR | Có | Không audit chi tiết | Không E2E/reconnect/scale-out verification | P1 | SignalR integration test, Redis backplane nếu multi-node. |
| Admin & Monitoring | User admin, health, logs | User admin + `/health` + Seq | Không audit chi tiết | Docker app orchestration, observability/security hardening thiếu | P1 | Containerize APIs, health dependency checks, secret management. |

## Risks

1. **P0 - Event loss / inconsistent workflow:** publisher swallow exception; không có transactional Outbox, DLQ hoặc publish confirm.
2. **P0 - Broken reader-voting business rule:** không có Reader role và POST reader-votes chỉ cho EditorialBoard/Admin.
3. **P0 - Data exposure/unauthorized modification:** RBAC controller chưa đủ để bảo đảm ownership và assignment ở mọi query/command.
4. **P0 - File storage deviates from target:** MinIO có adapter nhưng runtime mặc định dùng local disk; thumbnail chưa có processing flow.
5. **P1 - Deployment gap:** Compose không chạy API/Gateway, địa chỉ `localhost` không thích hợp giữa container, thiếu orchestration health dependencies.
6. **P1 - Credentials in source configuration:** development credentials/keys có thể bị dùng sai môi trường.
7. **P1 - Test coverage gap:** 36 test đều thuộc một gRPC integration project; thiếu REST authorization, contract/event, RabbitMQ, MinIO và SignalR E2E test.
8. **P2 - API maturity:** thiếu pagination/filter/search, delete/update đầy đủ ở nhiều resource và API Submission độc lập.

## Build and Test Status

- `dotnet build MangaSystemPlatform.Server.sln --no-restore`: **Succeeded**, 0 warning, 0 error.
- `dotnet test MangaSystemPlatform.Server.sln --no-build`: **Passed**, 36 passed / 0 failed / 0 skipped.
- Không chạy migration, không chạy `database update`, không xóa Docker volume/data.

## Recommended Next Steps

1. Chốt rule ownership/assignment cho toàn bộ Manga, File và Editorial API; biến chúng thành checks tại application/service, sau đó viết test theo matrix role x resource owner.
2. Sửa domain/API Reader Voting: xác định Reader là role hoặc loại user, mở quyền cast vote đúng đối tượng, chống vote trùng và test ranking.
3. Hoàn thiện workflow manga: CRUD thiếu của Series/Chapter/Page/Annotation, liên kết page-file và quyết định Submission là aggregate/API riêng hay chỉ là task operation.
4. Đưa event bus lên mức reliable: transactional Outbox, retry policy có backoff, dead-letter queue, monitoring event failure; không nuốt lỗi publish im lặng.
5. Chốt storage deployment: dùng MinIO qua environment, private/presigned URL theo policy, thumbnail processing và virus/file validation nếu scope cho phép.
6. Containerize Gateway và tất cả API, đổi service discovery từ `localhost` sang service name, thêm healthcheck/depends_on và tách secrets khỏi repository.
7. Bổ sung test REST/E2E: JWT/RBAC/ownership, PostgreSQL migration smoke, RabbitMQ Inbox/event flow, MinIO upload/download/version, SignalR delivery.

## P0/P1/P2 Roadmap

| Priority | Mục tiêu hoàn thành | Tiêu chí chấp nhận |
|---|---|---|
| P0 | Ownership/authorization, Reader Voting, CRUD/workflow manga, MinIO runtime, reliable event delivery design | Không user nào đọc/sửa tài nguyên ngoài scope; Reader vote được đúng rule; luồng file-task-review hoạt động E2E; event không mất khi broker lỗi. |
| P1 | Dockerized runtime, secret management, test automation, SignalR scale/reconnect, editorial assignment | `docker compose up` chạy được full stack; secrets không hard-code; CI chạy auth/event/file tests; reviewer scope đúng. |
| P2 | Pagination/search/filter, API documentation hoàn chỉnh, admin/audit enhancement, observability dashboard | API đáp ứng dữ liệu lớn; Swagger/contract rõ; truy vết hành động và dashboard vận hành đầy đủ. |

## Kết luận

Backend đã vượt qua mức skeleton: có domain model, persistence, API, JWT, event contracts/consumer, Inbox và notification realtime thật. Để có một MVP demo đáng tin cậy, ưu tiên trước hết không phải thêm service mới mà là đóng các lỗ hổng workflow và authorization P0, sau đó chạy full stack qua Docker và thêm E2E tests. Với các P0 hiện tại, hệ thống phù hợp để tiếp tục tích hợp nội bộ nhưng chưa nên coi là sẵn sàng triển khai cho người dùng thực.
