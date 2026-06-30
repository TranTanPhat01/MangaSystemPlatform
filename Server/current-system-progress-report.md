# Current System Progress Report

## 1. Executive Summary

Hệ thống **MangaSystemPlatform** đã có nền tảng kiến trúc Microservices và Clean Architecture rất tốt, chuẩn mực, tách biệt database cho từng service. Các cơ chế truyền dẫn nâng cao như gRPC Correlation ID propagation và RabbitMQ EventBus connection reuse đã được cài đặt và bao phủ đầy đủ bằng unit/integration tests (tổng cộng 32/32 tests đạt 100%).

Tuy nhiên, hệ thống vẫn còn một số thành phần cốt lõi chưa hoàn thiện ở backend (MinIO Storage, SignalR Hub) và frontend vẫn đang sử dụng mock data ở các trang nghiệp vụ chính.

Trạng thái hoàn thành ước tính:
* Backend architecture: 85%
* gRPC: 95%
* RabbitMQ: 90%
* File Storage: 50%
* Notification realtime: 20%
* Frontend integration: 40%
* Testing: 90%
* Production readiness: 60%

---

## 2. Phase Status

| Phase | Area | Status | Evidence | Missing / Risk | Next Action |
| ----- | ---- | ------ | -------- | -------------- | ----------- |
| **Phase 1** | gRPC Correlation ID | **Completed** | `InternalGrpcClientInterceptor.cs`<br>`InternalGrpcServerInterceptor.cs`<br>`CorrelationIdContext.cs`<br>Test: `CorrelationIdInterceptorTests.cs` | Không có rủi ro về mặt logic. Cần test runtime thực tế để kiểm tra leak AsyncLocal. | Chạy kiểm thử thủ công (manual runtime verify) khi có Docker. |
| **Phase 2** | RabbitMQ EventBus | **Completed** | `RabbitMqEventBus.cs` (tái sử dụng Connection, tạo Channel trên mỗi publish)<br>Test: `RabbitMqEventBusTests.cs` | Chưa có Outbox Pattern. Tin nhắn xuất bản lúc RabbitMQ sập sẽ bị mất. | Chạy kiểm thử tích hợp thực tế với docker-compose. |
| **Phase 3** | MinIO Storage | **Partially Implemented** | Enum `StorageProvider.MinIO` (`StorageProvider.cs`) <br>MinIO container (`docker-compose.yml`) <br>Cấu hình MinIO (`appsettings.json` của File Service) | Thiếu class implementation client `MinIoFileStorageService`. Hệ thống hiện tại đang bị cứng cấu hình (hardcoded) vào `LocalFileStorageService`. | Viết class `MinIoFileStorageService` kế thừa `IFileStorageService` và đăng ký động trong DI. |
| **Phase 4** | SignalR Notification | **Missing (Backend)** / **Partially Implemented (Frontend)** | **Frontend**: `Client/lib/signalr.ts` đã viết code kết nối đến `/notifications/hub`<br>**Backend**: `notification-service` hoàn toàn không có Hub hay config SignalR. | Người dùng không nhận được thông báo thời gian thực trừ khi F5 reload trang (chưa hoạt động realtime). | Xây dựng `NotificationHub` trong Notification Service backend và cấu hình định tuyến qua YARP Gateway. |
| **Phase 5** | Frontend API Integration | **Partially Implemented** | Dự án Next.js tại `/Client`<br>`auth-store.ts` kết nối login/register thực tế.<br>`notification-store.ts` kết nối đọc thông báo thực tế. | Các trang nghiệp vụ chính: Series (`series/page.tsx`), Tasks (`tasks/page.tsx`), Editorial (`editorial/page.tsx`), Files (`files/page.tsx`) đang dùng 100% mock data tĩnh. | Viết các Zustand stores và axios API integrations thay thế mock data trên frontend. |
| **Phase 6** | Production Hardening | **Partially Implemented** | Ghi log tập trung (Serilog + Seq), Standard API Response wrapper (`ApiResponse<T>`), Global exception middleware, Downstream Health check aggregations (`/health/services` ở Gateway). | Chưa định nghĩa các Service API chạy trong docker-compose (chỉ có infra). Chưa cấu hình Auto-apply database migrations khi khởi chạy container. Thiếu DLQ trong RabbitMQ. | Thêm container cho các dịch vụ chính vào docker-compose, thiết lập script chạy migration tự động lúc startup. |

---

## 3. Service-by-Service Status

### Gateway
* **Status**: Mostly Completed
* **Risks**: Chưa cấu hình Rate Limiting và DDoS protection tại YARP. Nếu bị tấn công flood request có thể làm quá tải các service con.
* **Evidence**: 
  * Cấu hình cluster và route: [appsettings.json](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/gateway/Manga.Gateway/appsettings.json)
  * Logic gộp healthcheck: [Program.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/gateway/Manga.Gateway/Program.cs#L39-L53)
* **Next task**: Cấu hình thêm Rate Limiting tại YARP.

### Identity Service
* **Status**: Completed
* **Risks**: Token lifetime cấu hình tĩnh, chưa có cơ chế block/blacklist token bị xâm phạm tức thì (ngoại trừ logout).
* **Evidence**:
  * gRPC check: [IdentityGrpcServiceImpl.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/services/identity-service/Manga.Identity.Api/GrpcServices/IdentityGrpcServiceImpl.cs)
  * Contract tests: [IdentityGrpcContractTests.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/tests/MangaSystemPlatform.GrpcIntegrationTests/IdentityGrpcContractTests.cs)
* **Next task**: Kiểm thử tích hợp runtime sau khi dựng DB.

### Manga Management Service
* **Status**: Completed
* **Risks**: Phụ thuộc nhiều vào đồng bộ gRPC (CheckUserExists, FileExists). Nếu Identity hoặc File Service bị chậm, Manga Service sẽ bị nghẽn (Cascading failure).
* **Evidence**:
  * Logic tạo task gọi gRPC: [TaskService.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/services/manga-service/Manga.Management.Application/Services/TaskService.cs)
  * Inbox pattern: Bảng `inbox_messages` đã migrate.
* **Next task**: Tích hợp dữ liệu thật lên frontend.

### File Service
* **Status**: Partially Implemented (Thiếu MinIO Storage Provider)
* **Risks**: Đang lưu file trên ổ cứng local (`LocalFileStorageService`). Khi scaling ứng dụng lên nhiều container, file upload lên container A sẽ không được tìm thấy bởi container B.
* **Evidence**:
  * Cứng cấu hình DI: [FileInfrastructureServiceCollectionExtensions.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/services/file-service/Manga.File.Infrastructure/DependencyInjection/FileInfrastructureServiceCollectionExtensions.cs#L38)
  * Local Storage class: [LocalFileStorageService.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/services/file-service/Manga.File.Infrastructure/Services/LocalFileStorageService.cs)
* **Next task**: Viết và đăng ký `MinIoFileStorageService`.

### Editorial Service
* **Status**: Completed
* **Risks**: Tương tự Manga Service, phụ thuộc vào gRPC lookup Manga/Chapter.
* **Evidence**:
  * Logic review: [EditorialReviewService.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/services/editorial-service/Manga.Editorial.Application/Services/EditorialReviewService.cs)
  * Test: [BusinessFlowTests.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/tests/MangaSystemPlatform.GrpcIntegrationTests/BusinessFlowTests.cs#L129-L190)
* **Next task**: Tích hợp dữ liệu thật lên frontend.

### Notification Service
* **Status**: Partially Implemented (Thiếu SignalR Hub)
* **Risks**: Notification chỉ lưu vào database. Không thể đẩy tin nhắn thời gian thực (real-time push) lên client Next.js.
* **Evidence**:
  * DB Context: [NotificationDbContext.cs](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Server/services/notification-service/Manga.Notification.Infrastructure/Persistence/NotificationDbContext.cs)
  * Consumer: Lắng nghe event thành công nhưng chỉ ghi DB.
* **Next task**: Xây dựng SignalR Hub và cấu hình kết nối.

### Frontend (Next.js)
* **Status**: Partially Implemented
* **Risks**: Sử dụng mock data làm ẩn đi các lỗi không tương thích payload (contract mismatch) giữa client và gateway API.
* **Evidence**:
  * Mock reviews: [editorial/page.tsx](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Client/app/editorial/page.tsx#L7)
  * Mock tasks: [tasks/page.tsx](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Client/app/tasks/page.tsx#L7)
  * Mock series: [series/page.tsx](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Client/app/series/page.tsx#L7)
  * Mock files: [files/page.tsx](file:///d:/KI%208%20FPT/PRN232/MangaSystemPlatform/Client/app/files/page.tsx#L7)
* **Next task**: Viết API hooks/Zustand store và thay thế mock variables bằng dữ liệu gọi từ API Gateway.

---

## 4. Critical Gaps

### Must Fix Before Demo
1. **Thiếu MinIO Storage Provider**: File tải lên không lưu được tập trung trên Object Storage.
2. **Thiếu SignalR Hub ở Backend**: Luồng notification không tự động cập nhật thời gian thực trên thanh thông báo Dashboard.
3. **Frontend Mock Data**: Hầu như tất cả các màn hình core nghiệp vụ (Series, Tasks, Reviews, Upload File) đang dùng mock data.

### Should Fix Before Final Submission
1. **Chạy Migration tự động**: Các service chưa tự động migration lúc khởi động. Nếu triển khai lên server thật/Docker mới sẽ bị lỗi thiếu bảng database.
2. **Dockerize các ứng dụng API**: Cần đưa tất cả các microservices vào `docker-compose.yml` để chạy toàn bộ hệ thống bằng 1 lệnh.
3. **YARP Rate Limiting**: Tránh bị DDoS làm sập Gateway.

### Nice To Have
1. **Outbox Pattern**: Đảm bảo tin nhắn RabbitMQ không bao giờ bị mất nếu EventBus sập tạm thời.
2. **mTLS (gRPC security)**: Hiện gRPC đang bảo vệ bằng API Key tĩnh dạng Header Metadata. Trên môi trường Prod cần TLS để mã hóa đường truyền gRPC.
3. **AI Service FastAPI**: Hoàn thiện các endpoint AI phân tích trang truyện/dịch thuật (hiện tại mới chỉ có endpoint `/health` trả về string rỗng).

---

## 5. Test Status

* **Test project đang có**: `tests/MangaSystemPlatform.GrpcIntegrationTests` (xUnit, FluentAssertions, Moq).
* **Số lượng test**: 32 test.
* **Kết quả chạy**: **Passed 100% (32/32 tests passed)**.
* **Các test tự động (Automated)**:
  * gRPC Contracts: `IdentityGrpcContractTests.cs`, `FileGrpcContractTests.cs`, `MangaGrpcContractTests.cs`.
  * Middleware & Interceptors: `CorrelationIdInterceptorTests.cs`, `InternalGrpcHealthCheckTests.cs`.
  * Messaging infrastructure: `RabbitMqEventBusTests.cs`.
  * Xử lý luồng nghiệp vụ: `BusinessFlowTests.cs` (kiểm thử mock-integration).
* **Test cần xác thực thủ công (Manual runtime verification)**:
  * Kiểm tra tích hợp log trace với Seq qua gateway thực tế.
  * Kiểm tra kết nối SignalR realtime frontend-backend.
  * Kiểm tra lưu trữ file vật lý trên MinIO console (`http://localhost:9001`).

---

## 6. Recommended Next Tasks

Theo thứ tự ưu tiên từ cao xuống thấp:

1. **Bật Docker Daemon & Khởi động Infrastructure**:
   * Khởi chạy docker compose để chạy DB, RabbitMQ, Redis, MinIO và Seq.
2. **Implement Phase 3 (MinIO Storage Provider)**:
   * Cài đặt package `Minio` trong project `Manga.File.Infrastructure`.
   * Tạo class `MinIoFileStorageService` hiện thực `IFileStorageService`.
   * Cấu hình đăng ký động trong DI dựa trên `FileStorage:Provider`.
3. **Implement Phase 4 (SignalR Notification Hub)**:
   * Thêm SignalR vào `Manga.Notification.Api`.
   * Tạo `NotificationHub` kế thừa `Hub`.
   * Đăng ký routing Hub tại gateway YARP và Api của Notification Service.
   * Cập nhật các event consumers để gọi `HubContext.Clients.User(...)` gửi thông báo trực tiếp.
4. **Implement Phase 5 (Frontend API Integration)**:
   * Viết store/service gọi API `/manga/series`, `/manga/tasks`, `/editorial/reviews` thay thế mock data.
5. **Phase 6 Hardening**:
   * Viết Dockerfile cho toàn bộ microservices và bổ sung vào `docker-compose.yml` để build đồng loạt.
   * Cấu hình tự động migration db lúc ứng dụng khởi chạy (`dbContext.Database.Migrate()`).

---

## 7. Commands to Verify

### Kiểm tra build solution backend:
```powershell
dotnet build MangaSystemPlatform.Server.sln
```

### Chạy kiểm thử tự động backend:
```powershell
dotnet test MangaSystemPlatform.Server.sln
```

### Khởi động hạ tầng Docker:
```powershell
docker compose up -d
```

### Build & Chạy Frontend Client (Next.js):
```powershell
cd d:\KI 8 FPT\PRN232\MangaSystemPlatform\Client
npm install
npm run build
```

---

## 8. Final Recommendation

* **Có thể chuyển phase tiếp theo chưa?**: Chưa thể chuyển sang golive/production hardening (Phase 6) vì bị block bởi các tính năng cốt lõi chưa hoàn thành ở Phase 3 (MinIO), Phase 4 (SignalR Hub) và Phase 5 (Frontend API Integration).
* **Bị block bởi gì?**: Thiếu cài đặt `MinIoFileStorageService` ở backend File Service, thiếu hub websocket ở Notification Service, và giao diện Next.js đang hiển thị dữ liệu giả.
* **Task tiếp theo đề xuất giao cho AI Agent**: 
  > *"Hãy xây dựng lớp lưu trữ `MinIoFileStorageService` tích hợp với MinIO Client trong `Manga.File.Infrastructure` kế thừa `IFileStorageService`. Cập nhật file đăng ký dependency injection `FileInfrastructureServiceCollectionExtensions.cs` để hỗ trợ chọn provider động từ file cấu hình (Local hoặc MinIO) và chạy thử kiểm thử build/test."*
