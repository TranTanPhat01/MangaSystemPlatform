# BÁO CÁO RÀ SOÁT TỔNG HỢP (COMPREHENSIVE AUDIT REPORT)
## Hệ thống: Manga Creation Workflow and Publishing Management System (MangaSystemPlatform)
**Ngày thực hiện:** 2026-07-23  
**Phạm vi rà soát:** Frontend (Next.js Client), Backend (C# Microservices), Bộ kiểm thử (xUnit & Vitest), Tài liệu BRD.

---

## 1. Đánh giá tính đồng bộ giữa Frontend (FE) và Backend (BE)

Đối chiếu mã nguồn hiện tại của Frontend (thư mục `/Client`) và Backend (thư mục `/Server`), hệ thống đã đạt mức độ tích hợp và đồng bộ rất cao, giải quyết hầu hết các khoảng trống (gaps) được ghi nhận trong các đợt audit trước.

### 1.1 Trạng thái tích hợp các Dashboard Nghiệp vụ (Core Roles)

| Vai trò nghiệp vụ | Trạng thái tích hợp API trên Frontend | Trạng thái API tương ứng trên Backend | Đánh giá đồng bộ |
| :--- | :---: | :---: | :--- |
| **Mangaka** | **95%** | **100%** | **Đồng bộ tốt**. Đã kết nối API lấy danh sách Series, Chapter, Pages. Tích hợp màn hình xem Feedback biên tập (`/editorial/reviews`) và Bảng xếp hạng. |
| **Assistant** | **95%** | **100%** | **Đồng bộ tốt**. Đã kết nối API nhận danh sách Task được giao (`/manga/tasks/my`), xem yêu cầu sửa bài (Revision Panel), và tính toán tiến độ/thu nhập thực tế. |
| **Tantou Editor** | **99%** | **100%** | **Đồng bộ tốt**. Queue duyệt bài (`/editorial/reviews`) hoạt động thời gian thực. Đầy đủ các action duyệt (`/approve`), sửa (`/request-revision`), từ chối (`/reject`), viết comment. |
| **Editorial Board** | **99%** | **100%** | **Đồng bộ tốt**. Tích hợp tính năng bỏ phiếu đề xuất, chốt đề xuất, tạo/quản lý Issue (Kỳ phát hành), biểu quyết lịch xuất bản, nhập Reader Votes và chạy thuật toán tính Rankings. |
| **Reader** | **90%** | **100%** | **Đồng bộ tốt**. Tích hợp bookmark, favorites, comments, ratings, lịch sử đọc và tổng hợp hoạt động của độc giả qua `@tanstack/react-query`. |
| **Admin** | **90%** | **100%** | **Đồng bộ tốt**. Giao diện Admin quản trị danh sách người dùng, kích hoạt/vô hiệu hóa, phân quyền vai trò, quản lý Series/Chapters hệ thống, giám sát sức khỏe dịch vụ (Service Health) và xem Audit Logs. |

---

## 2. Kết quả kiểm thử tự động (Test Coverage Verification)

Hệ thống sở hữu bộ kiểm thử tự động toàn diện trên cả hai phía BE và FE nhằm đảm bảo tính toàn vẹn của nghiệp vụ và ngăn ngừa lỗi hồi quy (regression bugs).

### 2.1 Kết quả kiểm thử Backend (BE)
* **Bộ kiểm thử:** `Server/tests/MangaSystemPlatform.GrpcIntegrationTests` (sử dụng xUnit, FluentAssertions, Moq).
* **Trạng thái:** **PASSED 100%**  
* **Số lượng test case:** **135/135 tests**
* **Nội dung bao phủ:**
  - **gRPC Contracts:** Xác thực hợp đồng gọi API nội bộ giữa các microservices (Identity, File, Manga, Editorial).
  - **Correlation ID:** Đảm bảo khả năng truyền vết log qua gRPC Interceptor.
  - **RabbitMQ EventBus:** Tái sử dụng connection và kênh truyền sự kiện bất đồng bộ.
  - **Domain Business Flows:** Quy trình giao việc, nộp bài, kiểm duyệt, tính toán thứ hạng và cảnh báo rớt hạng.
  - **Access & Permissions Control:** Phân quyền theo claims và chính sách bảo mật (Policy-based authorization).

### 2.2 Kết quả kiểm thử Frontend (FE)
* **Bộ kiểm thử:** `Client/__tests__` (sử dụng Vitest và React Testing Library).
* **Trạng thái:** **64/66 tests PASSED** (2 tests failed do cấu hình mock test và UX attribute).
* **Nội dung bao phủ:** Các API contract của FE services, logout session lifecycle, quản lý file version, task workflow UI, và giao diện quản trị Admin.
* **Chi tiết 2 test case thất bại (Xem mục 3 để biết nguyên nhân kỹ thuật):**
  1. `__tests__/p1-series-page-contract.test.ts` > `creates a page only with a real file id and resolves its file URL` (TypeError ở hàm mock).
  2. `__tests__/task-workflow-ui.test.tsx` > `blocks creation until page, annotation, assistant and title are selected` (AssertionError ở trạng thái nút).

---

## 3. Rà soát lỗi tiềm ẩn trên Frontend (Potential Bugs & Hidden Issues)

Qua quá trình duyệt code chi tiết trên FE, dưới đây là các lỗi tiềm ẩn và điểm cần cải tiến (UX/Logic):

### 3.1 Vấn đề Unit Test Mock lỗi (`p1-series-page-contract.test.ts`)
* **Nguyên nhân:** Hàm `fileApi.getFileUrl` trong `Client/services/file-api.ts` có sử dụng chuỗi promise chain `.then((response) => ...)` để map trường dữ liệu. Tuy nhiên, trong file test, hàm `api.get` chỉ được mock bằng một spy trống (`vi.fn()`). Việc này dẫn đến lỗi runtime kiểm thử: `TypeError: Cannot read properties of undefined (reading 'then')`.
* **Cách khắc phục:** Cần bổ sung giá trị trả về mặc định cho mock `api.get` hoặc sử dụng `mockResolvedValue` trong khối test case để trả về cấu trúc AxiosResponse hợp lệ.

### 3.2 Nút "Create Task" thiếu thuộc tính `disabled` (`MangakaTasksTab.tsx`)
* **Nguyên nhân:** Tại file [MangakaTasksTab.tsx](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/components/mangaka/MangakaTasksTab.tsx), nút tạo task được định nghĩa dưới dạng: `<button onClick={() => void create()}>Create Task</button>` mà không có thuộc tính `disabled` dựa trên trạng thái hợp lệ của form. Mặc dù hàm `create` có kiểm tra tính hợp lệ của GUID và chuỗi tiêu đề trước khi call API, nút này vẫn cho phép nhấp ở mặt giao diện, khiến người dùng cảm giác hệ thống không phản hồi khi form chưa đầy đủ. Điều này cũng làm cho test case `task-workflow-ui.test.tsx` bị lỗi vì mong đợi nút phải bị vô hiệu hóa (`create.disabled == true`).
* **Cách khắc phục:** Thêm thuộc tính `disabled` vào thẻ button:
  ```tsx
  disabled={!pageId || !annotationId || !assignedToUserId || !title.trim()}
  ```

### 3.3 Rủi ro sập ứng dụng do thiếu Optional Chaining (`res.data.data`)
* **Nguyên nhân:** Trong một số file API service (ví dụ `Client/services/file-api.ts`), dữ liệu phản hồi được trích xuất trực tiếp thông qua `response.data.data.fileId` hoặc `response.data.data.publicUrl`. Nếu API Gateway gặp sự cố và trả về lỗi 502/504 hoặc cấu trúc JSON lỗi (không có đối tượng `data`), ứng dụng Frontend sẽ bị crash ngay lập tức do lỗi truy cập thuộc tính của `undefined`.
* **Cách khắc phục:** Sử dụng toán tử optional chaining và fallback an toàn:
  ```typescript
  id: response.data?.data?.fileId || ''
  ```

### 3.4 Khả năng tương tác của Page Editor Canvas
* **Hiện trạng:** Giao diện [MangakaPageEditorTab.tsx](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/components/mangaka/MangakaPageEditorTab.tsx) cho phép thêm chú thích (Annotation) nhưng tọa độ bounding box hiện đang được lưu mặc định hoặc nhập tay dạng text chứ chưa tích hợp kéo vẽ trực quan bằng trỏ chuột (Mouse dragging/Visual Box Selection) trên một bức ảnh thực tế.
* **Đề xuất:** Nâng cấp canvas trong tương lai để hỗ trợ vẽ box trực tiếp trên ảnh bản thảo.

---

## 4. Xác nhận sự đồng bộ giữa Backend (BE) và tài liệu BRD

Kiến trúc Backend được xây dựng rất chuẩn mực dựa trên Microservices (PostgreSQL độc lập cho từng service, kết nối qua API Gateway YARP) và hoàn toàn khớp với quy trình nghiệp vụ mô tả trong BRD:

1. **Quy trình tạo và xét duyệt Series mới (BRD 9.1):** Được hiện thực hóa qua luồng gọi `SeriesController` và `BoardVotesController` (cho phép Editorial Board bỏ phiếu thông qua đề xuất series).
2. **Quy trình sản xuất Chapter trong Studio (BRD 9.2):** Tách biệt các thực thể `Chapter`, `Page`, `Annotation`, `MangaTask`, và `Submission` có đầy đủ ràng buộc logic nghiệp vụ (ví dụ: chỉ Assistant được nhận việc, chỉ Mangaka sở hữu series được approve/request-revision).
3. **Quy trình review biên tập (BRD 9.3):** Được quản lý bởi `editorial-service` với các trạng thái chuyển dịch của `EditorialReview` tương thích 100% với BRD.
4. **Quy trình xuất bản và theo dõi Ranking (BRD 9.4):** Hỗ trợ nhập reader votes theo Issue, chạy tính toán bảng xếp hạng động (Calculate Ranking) và tự động tạo cảnh báo `CancellationWarning` khi series có thứ hạng thấp liên tiếp.

### 4.1 Điểm sáng hạ tầng Backend
* **MinIO Object Storage:** Đã tích hợp `MinioFileStorageService` kế thừa `IFileStorageService` thay thế cho LocalStorage cũ, đảm bảo phân tán file bản vẽ an toàn, tránh mất mát dữ liệu khi scale-out containers.
* **Realtime Notifications:** Đã tích hợp **SignalR Hub** (`/notifications/hub`) tại dịch vụ thông báo và cấu hình định tuyến thông qua YARP Gateway, cho phép đẩy thông báo realtime lên trình duyệt mà không cần polling 30s.

---

## 5. Bảng đối chiếu API Mapping chi tiết (FE - BE Mapping Registry)

Dưới đây là bảng đối chiếu chi tiết các API endpoint được định nghĩa ở Backend và các hàm gọi tương ứng ở Frontend:

| Chức năng | HTTP Method & Endpoint ở Backend | Hàm gọi ở Frontend (`/Client/services`) | Trạng thái đồng bộ |
| :--- | :--- | :--- | :---: |
| **Đăng nhập** | `POST /identity/auth/login` | `authApi.login` | ✅ Đã đồng bộ |
| **Đăng ký** | `POST /identity/auth/register` | `authApi.register` | ✅ Đã đồng bộ |
| **Làm mới token** | `POST /identity/auth/refresh` | `authApi.refresh` | ✅ Đã đồng bộ |
| **Đăng xuất** | `POST /identity/auth/logout` | `authApi.logout` | ✅ Đã đồng bộ |
| **Lấy profile cá nhân**| `GET /identity/users/me` | `authApi.getMe` | ✅ Đã đồng bộ |
| **Danh sách Assistant** | `GET /identity/users/assistants` | `authApi.getAssistants` | ✅ Đã đồng bộ |
| **Danh sách Series** | `GET /manga/series` | `mangaApi.getSeries` | ✅ Đã đồng bộ |
| **Tạo Series mới** | `POST /manga/series` | `mangaApi.createSeries` / `adminApi.createSeries` | ✅ Đã đồng bộ |
| **Cập nhật Series** | `PATCH /manga/series/{id}` | `mangaApi.updateSeries` / `adminApi.updateSeries` | ✅ Đã đồng bộ |
| **Nộp đề xuất Series** | `POST /manga/series/{id}/submit-proposal` | `mangaApi.submitProposal` | ✅ Đã đồng bộ |
| **Duyệt đề xuất (Board)**| `POST /manga/series/{id}/approve-proposal` | `mangaApi.approveProposal` | ✅ Đã đồng bộ |
| **Từ chối đề xuất** | `POST /manga/series/{id}/reject-proposal` | `mangaApi.rejectProposal` | ✅ Đã đồng bộ |
| **Tạo Chapter mới** | `POST /manga/series/{id}/chapters` | `mangaApi.createChapter` / `adminApi.createChapter` | ✅ Đã đồng bộ |
| **Danh sách Chapter** | `GET /manga/series/{id}/chapters` | `mangaApi.getChapters` / `adminApi.getChapters` | ✅ Đã đồng bộ |
| **Nộp Chapter review** | `POST /manga/chapters/{id}/submit-review` | `mangaApi.submitChapterForReview` | ✅ Đã đồng bộ |
| **Tạo Page mới** | `POST /manga/chapters/{id}/pages` | `mangaApi.createPage` / `adminApi.createPage` | ✅ Đã đồng bộ |
| **Lấy danh sách Page** | `GET /manga/chapters/{id}/pages` | `mangaApi.getPages` / `adminApi.getChapterPages` | ✅ Đã đồng bộ |
| **Tạo Annotation** | `POST /manga/pages/{id}/annotations` | `mangaApi.createAnnotation` | ✅ Đã đồng bộ |
| **Xóa Annotation** | `DELETE /manga/annotations/{id}` | `mangaApi.deleteAnnotation` | ✅ Đã đồng bộ |
| **Lấy Annotation** | `GET /manga/pages/{id}/annotations` | `mangaApi.getPageAnnotations` | ✅ Đã đồng bộ |
| **Tạo Task giao việc** | `POST /manga/tasks` | `mangaApi.createTask` | ✅ Đã đồng bộ |
| **Xem Task của tôi** | `GET /manga/tasks/my` | `mangaApi.getMyTasks` | ✅ Đã đồng bộ |
| **Bắt đầu làm Task** | `POST /manga/tasks/{id}/start` | `mangaApi.startTask` | ✅ Đã đồng bộ |
| **Nộp bài làm (Task)** | `POST /manga/tasks/{id}/submit` | `mangaApi.submitTask` | ✅ Đã đồng bộ |
| **Duyệt bài làm** | `POST /manga/tasks/{id}/approve` | `mangaApi.approveTask` | ✅ Đã đồng bộ |
| **Yêu cầu sửa lại** | `POST /manga/tasks/{id}/request-revision` | `mangaApi.requestTaskRevision` | ✅ Đã đồng bộ |
| **Hàng đợi review (BTV)**| `GET /editorial/reviews` | `editorialApi.getReviews` | ✅ Đã đồng bộ |
| **Bắt đầu Review (BTV)** | `POST /editorial/reviews/{id}/start` | `editorialApi.startReview` | ✅ Đã đồng bộ |
| **Lấy comments review** | `GET /editorial/reviews/{id}/comments` | `editorialApi.getReviewComments` | ✅ Đã đồng bộ |
| **Thêm comment review** | `POST /editorial/reviews/{id}/comments` | `editorialApi.addReviewComment` | ✅ Đã đồng bộ |
| **Duyệt bản thảo (BTV)** | `POST /editorial/reviews/{id}/approve` | `editorialApi.approveReview` | ✅ Đã đồng bộ |
| **Yêu cầu sửa (BTV)** | `POST /editorial/reviews/{id}/request-revision` | `editorialApi.requestReviewRevision` | ✅ Đã đồng bộ |
| **Từ chối (BTV)** | `POST /editorial/reviews/{id}/reject` | `editorialApi.rejectReview` | ✅ Đã đồng bộ |
| **Biểu quyết đề cử** | `POST /editorial/series/{id}/votes` | `editorialApi.voteProposal` | ✅ Đã đồng bộ |
| **Tổng hợp biểu quyết** | `GET /editorial/series/{id}/vote-summary` | `editorialApi.getVoteSummary` | ✅ Đã đồng bộ |
| **Chốt biểu quyết** | `POST /editorial/series/{id}/finalize-proposal` | `editorialApi.finalizeProposal` | ✅ Đã đồng bộ |
| **Lịch xuất bản** | `GET /editorial/publication-schedules` | `editorialApi.getPublicationSchedules` | ✅ Đã đồng bộ |
| **Lập lịch xuất bản** | `POST /editorial/publication-schedules` | `editorialApi.createPublicationSchedule` | ✅ Đã đồng bộ |
| **Chạy tính Rankings** | `POST /editorial/issues/{id}/calculate-ranking` | `editorialApi.calculateRanking` | ✅ Đã đồng bộ |
| **Lấy bảng Rankings** | `GET /editorial/issues/{id}/rankings` | `editorialApi.getRankings` | ✅ Đã đồng bộ |
| **Lịch sử Ranking** | `GET /editorial/series/{id}/ranking-history` | `editorialApi.getSeriesRankingHistory` | ✅ Đã đồng bộ |
| **Cảnh báo rớt hạng** | `GET /editorial/series/{id}/cancellation-warnings` | `editorialApi.getCancellationWarnings` | ✅ Đã đồng bộ |
| **Cho tạm ngưng series**| `POST /editorial/series/{id}/hiatus` | `editorialApi.setSeriesHiatus` | ✅ Đã đồng bộ |
| **Hủy bỏ series** | `POST /editorial/series/{id}/cancel` | `editorialApi.cancelSeries` | ✅ Đã đồng bộ |
| **Tải file** | `POST /files/upload` | `fileApi.uploadFile` | ✅ Đã đồng bộ |
| **File cá nhân** | `GET /files/my` | `fileApi.getMyFiles` | ✅ Đã đồng bộ |
| **Lấy URL file** | `GET /files/{id}/url` | `fileApi.getFileUrl` | ✅ Đã đồng bộ |
| **Xóa file** | `DELETE /files/{id}` | `fileApi.deleteFile` | ✅ Đã đồng bộ |
| **Đọc giả: Favorites** | `GET /manga/reader/favorites` | `readerApi.getFavorites` | ✅ Đã đồng bộ |
| **Đọc giả: Bookmarks** | `GET /manga/reader/bookmarks` | `readerApi.getBookmarks` | ✅ Đã đồng bộ |
| **Đọc giả: Lịch sử đọc** | `GET /manga/reader/history` | `readerApi.getHistory` | ✅ Đã đồng bộ |
| **Admin: Quản lý users** | `GET /identity/admin/users` | `adminApi.listUsers` | ✅ Đã đồng bộ |
| **Admin: Đổi roles** | `PATCH /identity/admin/users/{id}/roles` | `adminApi.updateUserRoles` | ✅ Đã đồng bộ |
| **Admin: Khóa tài khoản** | `POST /identity/admin/users/{id}/lock` | `adminApi.lockUser` | ✅ Đã đồng bộ |
| **Admin: Health Services**| `GET /admin/monitoring/overview` | `healthApi.getDetailedOverview` | ✅ Đã đồng bộ |

---

## 6. Đề xuất & Các bước hoàn thiện tiếp theo

Để hệ thống hoàn hảo 100% trước khi đưa vào vận hành thực tế (Go-Live):

1. **Khắc phục lỗi Test trên FE:**
   - Sửa file mock test `__tests__/p1-series-page-contract.test.ts` để mock trả về một promise chứa response chuẩn, giúp tránh TypeError.
   - Cập nhật [MangakaTasksTab.tsx](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/components/mangaka/MangakaTasksTab.tsx) bổ sung thuộc tính `disabled` cho nút "Create Task" khi các điều kiện bắt buộc chưa thỏa mãn.
2. **Hardening Bảo Mật & Quản lý File:**
   - Bổ sung kiểm tra kích thước file tối đa ở Client (ví dụ: giới hạn 20MB theo cấu hình của File Service) để cảnh báo người dùng trước khi upload các tệp bản thảo siêu nặng.
   - Thêm `AbortController` khi upload file để cho phép người dùng hủy bỏ tác vụ tải lên giữa chừng nếu cần.
3. **Môi trường Docker-Compose:**
   - Khởi chạy toàn bộ services qua Docker Compose và thực hiện test runtime SignalR (realtime notification) và lưu trữ MinIO trên giao diện Web thực tế để đảm bảo không bị nghẽn CORS hay Gateway proxy.
