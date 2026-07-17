# BÁO CÁO RÀ SOÁT CẤU TRÚC FRONTEND VÀ TRẠNG THÁI TÍCH HỢP API
## HỆ THỐNG QUẢN LÝ QUY TRÌNH SÁNG TÁC VÀ XUẤT BẢN MANGA (MangaSystemPlatform)

---

### 1. XÁC NHẬN TRIỂN KHAI ROLE ADMIN
Hiện tại, **Role Admin chưa được triển khai** trong cấu trúc của FE. Cụ thể:
- **Trang Dashboard chính (`app/dashboard/page.tsx`)**: Đang trả về trực tiếp và duy nhất `<MangakaDashboard />`. Dù đăng nhập với tài khoản Admin, hệ thống vẫn hiển thị giao diện dành riêng cho vai trò Mangaka.
- **Sidebar (`DashboardLayoutWrapper.tsx`)**: Đã có logic hiển thị thêm 2 menu khi phát hiện role `admin` (gồm "Users" trỏ đến `/dashboard?tab=users` và "System" trỏ đến `/dashboard?tab=system`). Tuy nhiên, khi nhấp vào, giao diện không thay đổi vì `MangakaDashboard` không xử lý các tab này.
- **Chưa có Component quản trị**: Không tồn tại bất kỳ thư mục hay file giao diện quản trị nào cho Admin (như quản lý người dùng, phân quyền, cấu hình hệ thống, theo dõi nhật ký logs/health).
- **Chưa có API Admin**: File `services/auth-api.ts` chưa triển khai các hàm CRUD người dùng và vai trò để Admin gọi xuống backend.

---

### 2. TRẠNG THÁI LIÊN KẾT API CỦA CÁC MÀN HÌNH ĐÃ CÓ (XÁC NHẬN CALL API)
Dựa theo tài liệu BRD và đối chiếu cấu trúc code hiện tại, dưới đây là bảng đánh giá chi tiết tình hình tích hợp API của các màn hình đã phát triển:

| Nhóm Vai Trò / Màn Hình | Tình Trạng Giao Diện (UI) | Trạng Thái Liên Kết API (Call API) | Chi Tiết Kỹ Thuật & Phần Còn Thiếu |
| :--- | :---: | :---: | :--- |
| **Authentication & Profile** | Đã hoàn thành | **Đã hoàn thành 100%** | - Đã tích hợp API thực tế `/identity/auth/login` và `/identity/auth/register`. <br>- Cookies lưu token và vai trò hoạt động tốt thông qua `auth-store` và `middleware.ts`. |
| **Mangaka Dashboard** | Đã hoàn thành khung UI | **Chỉ kết nối API một phần (15%)** | - **Đã kết nối API thật**: Danh sách Series (`GET /manga/series`) và trung tâm thông báo Realtime (qua SignalR Hub `/notifications/hub` và API `/notifications/my`). <br>- **Hoàn toàn Mock (chưa call API)**: Quản lý Chapter, giao việc (Tasks), Upload bản vẽ (Files), Hàng đợi duyệt của BTV (Editorial Reviews), và Bảng xếp hạng. |
| **Assistant Dashboard** | Đã hoàn thành khung UI | **Chỉ kết nối API một phần (20%)** | - **Đã kết nối API thật**: Danh sách task được giao của Assistant (`GET /manga/tasks/my`). Có cơ chế tự động fallback về Mock data nếu DB trống. <br>- **Hoàn toàn Mock**: Upload submission (nộp bài), xem yêu cầu sửa bài (Revision Requests), thống kê thu nhập & tiến độ (Earnings & Progress). <br>- Tên người dùng và avatar trên Header vẫn đang hardcode ("Kenji Tanaka") chưa lấy từ store. |
| **Tantou Editor Dashboard** | Đã hoàn thành | **Đã hoàn thành 90%** | - **Đã kết nối API thật**: Lấy hàng đợi duyệt (Review Queue) tại `/editorial/reviews`. <br>- Thực hiện các tác vụ biên tập thực tế thành công: Nhận review (`/start`), Duyệt (`/approve`), Yêu cầu sửa (`/request-revision`), Từ chối (`/reject`), viết nhận xét (`/comments`). <br>- **Còn thiếu**: Trình canvas trực quan (vẽ vùng lỗi) trên ảnh bản thảo. |
| **Editorial Board Dashboard** | Đã hoàn thành | **Chỉ kết nối API một phần (60%)** | - **Đã kết nối API thật**: Duyệt đề xuất series (`GET /manga/series`), lấy/gửi biểu quyết (`votes`), chốt đề cử (`finalize-proposal`), quản lý lịch xuất bản (`/editorial/publication-schedules`). <br>- **Hoàn toàn Mock**: Bảng xếp hạng (Rankings) và Cảnh báo rớt hạng (Cancellation Risk) đang dùng mock data tĩnh. API tính toán ranking (`calculateRanking`) bị chặn cứng ở frontend do chưa truyền IssueId. |

---

### 3. DANH SÁCH TODOLIST CHI TIẾT ĐỂ HOÀN THIỆN
Dưới đây là lộ trình công việc cần thực hiện để hoàn thiện toàn bộ hệ thống Frontend theo yêu cầu BRD:

#### 3.1. Hoàn thiện Role Admin (Độ ưu tiên: Cao)
- [ ] **Bổ sung API Admin trong Services**:
  - [ ] Thêm API lấy danh sách toàn bộ User: `GET /identity/users` (hoặc `/identity/admin/users`).
  - [ ] Thêm API cập nhật Role cho User: `PUT /identity/users/{id}/role` hoặc `POST /identity/users/{id}/roles`.
  - [ ] Thêm API xem trạng thái Service Health: `GET /identity/health` (Kiểm tra sức khỏe của các service Gateway, Identity, Manga, Editorial, Files, Notification).
  - [ ] Thêm API xem Logs hệ thống: `GET /identity/logs`.
- [ ] **Phát triển Components cho Admin**:
  - [ ] Tạo thư mục `components/admin` để lưu trữ UI của Admin.
  - [ ] Thiết kế `AdminDashboard.tsx` làm trang bao quanh.
  - [ ] Viết component `UserManagementTab.tsx` (giao diện danh sách user dạng bảng, nút chỉnh sửa vai trò, nút kích hoạt/tắt hoạt động tài khoản).
  - [ ] Viết component `SystemHealthTab.tsx` (hiển thị thông số hoạt động của các Microservices).
  - [ ] Viết component `LogViewerTab.tsx` (bảng hiển thị các logs, bộ lọc mức độ log: Info, Warning, Error và thanh tìm kiếm).
- [ ] **Cấu hình Router Phân Quyền động**:
  - [ ] Chỉnh sửa `app/dashboard/page.tsx` để đọc vai trò người dùng từ `authStore` và trả về đúng component tương ứng (ví dụ: role Admin hiển thị `<AdminDashboard />` thay vì `<MangakaDashboard />`).
  - [ ] Cập nhật Next.js Middleware (`middleware.ts`) để bảo vệ các tuyến đường Admin chặt chẽ, tránh việc user thường tự truy cập bằng đường link.

#### 3.2. Hoàn thiện Dashboard cho Mangaka & Assistant (Độ ưu tiên: Cao - Nghiệp vụ cốt lõi)
- [ ] **Tích hợp API Quản lý Chapter**:
  - [ ] Chuyển tab Chapters sang call API thực tế: tạo chapter mới (`POST /manga/series/{id}/chapters`), lấy danh sách chapters của series, submit chapter cho editor (`POST /manga/chapters/{id}/submit`).
- [ ] **Tích hợp API Task & Workflow**:
  - [ ] **Mangaka**: Tạo task thực tế gắn với vùng tọa độ vẽ từ API (`POST /manga/tasks`). Phê duyệt task (`/approve`) hoặc yêu cầu sửa (`/request-revision`) thực tế thay vì mở modal mô phỏng.
  - [ ] **Assistant**: Cho phép nộp file vẽ (Upload Submission) qua API `POST /manga/tasks/{id}/submit` kèm theo file đính kèm thực tế.
- [ ] **Tích hợp API File Upload & Storage**:
  - [ ] Kết nối API của cổng `/files/upload` để thực hiện đẩy file nhị phân (ảnh bản thảo, tệp PSD) lên MinIO/S3 của hệ thống, trả về `fileId` để lưu metadata.
  - [ ] Thiết kế thanh tiến trình upload (Upload Progress Bar) giúp tối ưu hóa UI khi upload tệp tin nặng.
- [ ] **Phát triển Trình Page Editor Canvas (Annotation Tool)**:
  - [ ] Thiết kế trình tương tác Canvas HTML5/SVG tại tab "Page Editor" cho phép zoom-in, zoom-out, pan và kéo thả chuột để vẽ vùng hộp giới hạn (Bounding Box).
  - [ ] Lưu tọa độ dạng JSON gửi lên API `POST /manga/pages/{id}/annotations` khi giao việc hoặc ghi nhận lỗi.

#### 3.3. Hoàn thiện Dashboard cho Editorial Board & Tantou Editor (Độ ưu tiên: Trung bình)
- [ ] **Tích hợp API Rankings thực tế**:
  - [ ] Phát triển hộp thoại chọn Kỳ phát hành (IssueId) trên giao diện để kích hoạt tính năng "Tính BXH" thực tế gọi xuống `/editorial/rankings/calculate`.
  - [ ] Đọc danh sách xếp hạng thực tế từ API `GET /editorial/rankings` thay vì nạp file JSON tĩnh.
- [ ] **Bổ sung giao diện Cảnh báo rớt hạng (Cancellation Risk)**:
  - [ ] Đọc thông số `cancellationRiskLevel` từ Series API thực tế để hiển thị cảnh báo đỏ/vàng trên màn hình Board và Tantou Editor.
- [ ] **Tích hợp xem Annotation trực tiếp khi Review**:
  - [ ] Cho phép Tantou Editor khi bấm Review Chapter có thể nhìn thấy các vùng Annotations mà tác giả đã khoanh, và có thể vẽ thêm vùng ghi chú lỗi trực tiếp lên trang truyện để gửi trả lại studio.
