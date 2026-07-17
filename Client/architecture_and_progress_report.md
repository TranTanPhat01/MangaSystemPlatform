# BÁO CÁO RÀ SOÁT KIẾN TRÚC VÀ TIẾN ĐỘ PHÁT TRIỂN
## HỆ THỐNG QUẢN LÝ QUY TRÌNH SÁNG TÁC VÀ XUẤT BẢN MANGA (MangaSystemPlatform - Client)

---

### 1. TỔNG QUAN KIẾN TRÚC HIỆN TẠI (CLIENT-SIDE)

Nền tảng Frontend được phát triển bằng công nghệ hiện đại, có cấu trúc tốt và sẵn sàng cho việc mở rộng. Dưới đây là các điểm cốt lõi trong kiến trúc hiện tại:

- **Framework**: **Next.js 16.2.6 (App Router)** & **React 19.2.4**. Sử dụng mô hình định tuyến thư mục (Folder-based Routing) hiện đại.
- **Styling (CSS)**: **Tailwind CSS v4** kết hợp với các icon của thư viện **Lucide React**. Thiết kế giao diện theo phong cách tối (Dark Mode), phối hợp màu sắc sang trọng (Burgundy/Plum) và đậm chất Manga/Anime.
- **State Management**: Sử dụng **Zustand (phiên bản 5.0.13)** để quản lý trạng thái tập trung. Hiện tại có hai store chính:
  - [auth-store.ts](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/store/auth-store.ts): Lưu trữ thông tin đăng nhập, token xác thực và tự động đồng bộ sang Cookie.
  - [notification-store.ts](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/store/notification-store.ts): Lưu trữ danh sách thông báo và số lượng thông báo chưa đọc.
- **Xác thực & Bảo vệ định tuyến (Security & Route Guard)**:
  - Sử dụng Next.js Middleware tại [middleware.ts](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/middleware.ts) để kiểm tra Cookie `auth_token` trước khi cho phép truy cập các trang nội bộ (chỉ cho phép truy cập `/`, `/login`, `/register` khi chưa đăng nhập).
  - Tự động điều hướng dựa trên quyền của vai trò (Roles) lấy từ Cookie `user_roles`.
- **Giao tiếp API (Networking)**:
  - Cấu hình Axios instance tại [api.ts](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/lib/api.ts) để tự động đính kèm `Bearer Token` từ Zustand store vào Header cho mọi Request.
  - Tự động bắt lỗi **401 Unauthorized** để xóa Cookie, xóa session và điều hướng người dùng về trang đăng nhập.
- **Realtime Connection**:
  - Tích hợp thư viện **@microsoft/signalr** tại [signalr.ts](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/lib/signalr.ts) để mở kết nối thời gian thực đến Hub thông báo (`/notifications/hub`) tại Backend.

---

### 2. ĐÁNH GIÁ TIẾN ĐỘ THỰC TẾ (PROGRESS STATUS)

Hiện tại dự án đang ở giai đoạn **hoàn thiện khung kiến trúc nền tảng và UI giao diện cơ bản (Mockup)**. Dưới đây là bảng đánh giá tiến độ chi tiết cho 12 nhóm yêu cầu chức năng nghiệp vụ của MVP (theo BRD):

| Mã Nhóm | Nhóm Chức Năng Nghiệp Vụ | Trạng Thái | Mô Tả Chi Tiết Tiến Độ Thực Tế |
| :--- | :--- | :---: | :--- |
| **BR-FR-01~05** | **Authentication & User Management** | **Đang hoàn thiện** | - Đã code hoàn chỉnh trang Login và Register tích hợp API thực tế `/identity/auth/login` và `/register`. <br>- Đã cấu hình Middleware chặn Route và lưu Cookies. <br>- **Còn thiếu**: Màn hình quản lý User/Role của Admin (`/dashboard?tab=users` đang bị bỏ trống). |
| **BR-FR-06~10** | **Series Management** | **Mock (Chỉ có UI)** | - Đã thiết kế giao diện danh sách Series tại `/series` và tab "My Series" trong Dashboard dưới dạng danh sách tĩnh. <br>- **Còn thiếu**: Kết nối API lấy danh sách, tạo Series mới, quy trình duyệt Series của Editorial Board. |
| **BR-FR-11~15** | **Chapter Management** | **Mock (Chỉ có UI)** | - Đã thiết kế danh sách Chapter kèm theo trạng thái, tiến độ hoàn thành tĩnh. <br>- **Còn thiếu**: API CRUD Chapter, nút "Submit for Review" chưa có xử lý thực tế mà chỉ hiển thị Modal thông tin. |
| **BR-FR-16~20** | **Page & Manuscript Management** | **Mock (Chỉ có UI)** | - Đã xây dựng giao diện quản lý file tại `/files` và tab "Files". Có khung Drag-and-Drop mô phỏng upload. <br>- **Còn thiếu**: Xử lý Upload file nhị phân qua API lên File Service; lưu trữ metadata và xem trước ảnh (preview). |
| **BR-FR-21~25** | **Annotation Management** | **Chưa bắt đầu** | - Tab "Page Editor" chỉ hiển thị màn hình trống thông báo "No Page Workspace Open" và nút mở Sandbox mô phỏng. <br>- **Còn thiếu**: Trình vẽ Canvas chọn vùng, lưu tọa độ JSON và tạo Annotation trực quan (đây là tính năng cốt lõi và phức tạp nhất của dự án). |
| **BR-FR-26~30** | **Task Management** | **Mock (Chỉ có UI)** | - Đã có giao diện bảng Task (TaskTable) hiển thị độ ưu tiên và trạng thái. <br>- **Còn thiếu**: API lấy danh sách Task của Assistant, phân công việc từ Mangaka cho Assistant và chuyển đổi trạng thái của Task. |
| **BR-FR-31~35** | **Submission Management** | **Mock (Chỉ có UI)** | - Nút hành động "Review" trên task đang mở modal popup tĩnh hiển thị text mô tả. <br>- **Còn thiếu**: API/UI để Assistant upload bài nộp, lịch sử nộp bài và chức năng duyệt/yêu cầu sửa của Mangaka. |
| **BR-FR-36~40** | **Editorial Review Management** | **Mock (Chỉ có UI)** | - Đã thiết kế trang `/editorial` hiển thị hàng đợi duyệt (Manuscripts Review Queue) với dữ liệu tĩnh. <br>- **Còn thiếu**: API gửi duyệt, giao diện cho Tantou Editor phê duyệt / yêu cầu chỉnh sửa và ghi chú lỗi trực tiếp lên trang manga. |
| **BR-FR-41~45** | **Editorial Board & Decision** | **Chưa bắt đầu** | - Chưa có màn hình riêng cho Editorial Board bỏ phiếu hoặc quyết định lịch xuất bản. Mới chỉ có mô phỏng trên landing page. |
| **BR-FR-46~50** | **Reader Voting & Ranking** | **Mock (Chỉ có UI)** | - Đã làm card cảnh báo rủi ro rớt hạng (RankingRiskCard) và bảng xếp hạng tĩnh trong tab "Rankings". <br>- **Còn thiếu**: Giao diện để Admin/Board nhập dữ liệu voting thực tế, API tự động tính toán thứ hạng và vẽ biểu đồ lịch sử thứ hạng. |
| **BR-FR-51~55** | **Notification Center** | **Đã hoàn thành** | - **Đã kết nối API thực tế** `/notifications/my` để tải thông báo. <br>- **Đã tích hợp SignalR** nhận thông báo thời gian thực tự động cập nhật số lượng tin nhắn chưa đọc. <br>- Đã làm chức năng "Đánh dấu đã đọc" (Mark as read). |
| **BR-FR-56~60** | **Admin & Monitoring** | **Chưa bắt đầu** | - Menu chuyển hướng phân quyền cho Admin đã có nhưng giao diện hiển thị thông tin log hệ thống, service health hay quản lý User/Role đều chưa được phát triển. |

---

### 3. CÁC PHẦN THIẾU SÓT LỚN CẦN BỔ SUNG (GAPS)

Để đưa ứng dụng Client từ bản **Mock-up/Prototype** lên bản chạy thực tế (**MVP Production-ready**), chúng ta cần tập trung giải quyết các khoảng trống công nghệ và chức năng sau:

#### A. Thiếu liên kết API Nghiệp vụ chính (Core Business API)
Hầu như toàn bộ quy trình nghiệp vụ Manga (từ Series, Chapter, Task đến Submission) đang hoạt động ngoại tuyến bằng dữ liệu cứng (mock data) được khai báo trực tiếp trong các Component.
- **Yêu cầu bổ sung**: Cần xây dựng các Store Zustand tương tự như `notification-store.ts` cho Series, Chapters, Tasks và Submissions, kết nối trực tiếp đến các cổng API Gateway (`/manga`, `/editorial`, `/files`) của Backend.

#### B. Trình biên tập khoanh vùng và ghi chú trang vẽ (Page Annotation Editor)
Đây là "linh hồn" của hệ thống giúp Mangaka giao việc và Editor kiểm lỗi trực tiếp trên ảnh bản thảo. Hiện phần này mới chỉ dừng lại ở giao diện tĩnh.
- **Yêu cầu bổ sung**: Cần phát triển một Component sử dụng HTML5 Canvas hoặc thư viện thao tác SVG để cho phép người dùng:
  - Zoom-in, Zoom-out, di chuyển (Pan) trang truyện.
  - Khoanh vùng hình chữ nhật / đa giác (Bounding Box) trên trang vẽ.
  - Lưu tọa độ vùng dạng JSON gửi lên cơ sở dữ liệu để liên kết vùng đó với ID của Task hoặc Comment.

#### C. Chức năng Upload và Quản lý file thực tế (Asset File Upload)
Hệ thống quản lý tệp tin (`/files`) hiện tại chưa thực hiện upload nhị phân mà chỉ hiển thị danh sách tĩnh.
- **Yêu cầu bổ sung**: Tích hợp luồng upload file thực tế sử dụng `FormData` qua API cổng `/files/upload` để đẩy file lên các dịch vụ lưu trữ (MinIO/S3) và nhận về `fileId` lưu vào metadata của Page/Submission. Có thanh tiến trình (Upload progress bar) để tối ưu trải nghiệm người dùng với các tệp tin PSD/PDF dung lượng lớn.

#### D. Luồng chuyển đổi trạng thái Task và duyệt bài nộp (Workflow State Machine)
Quy trình giao việc và duyệt bài của Studio chưa được liên kết chặt chẽ.
- **Yêu cầu bổ sung**: Phát triển giao diện chi tiết cho Task (Task Detail):
  - **Assistant**: Có nút "Upload Submission" để nộp kết quả công việc.
  - **Mangaka**: Có khu vực so sánh ảnh gốc và ảnh trợ lý đã sửa, cùng hai nút "Approve" (duyệt chuyển trạng thái Task sang Approved) và "Request Revision" (yêu cầu sửa lại kèm theo lý do).

#### E. Giao diện người dùng theo phân quyền vai trò (Role-based UI)
Mặc dù Sidebar và Header đã phản ứng theo vai trò người dùng đăng nhập, trang Dashboard chính hiện tại (`app/dashboard/page.tsx`) mới chỉ được thiết kế dành riêng cho vai trò **Mangaka** (với các số liệu của Mangaka).
- **Yêu cầu bổ sung**: Cần chia nhỏ và tạo giao diện Dashboard riêng cho từng vai trò:
  - **Assistant Dashboard**: Tập trung vào danh sách "My Tasks", hạn chót (Deadline), tiến độ duyệt và thống kê số trang vẽ đã được duyệt trong tháng.
  - **Tantou Editor Dashboard**: Tập trung vào Hàng đợi cần duyệt (Review Queue), lịch trình xuất bản của các bộ truyện được phân công theo dõi và cảnh báo rớt hạng.
  - **Editorial Board Dashboard**: Tập trung vào biểu quyết Series mới, quản lý bảng xếp hạng (Ranking Board) tổng hợp và nhập dữ liệu bình chọn độc giả.
  - **Admin Dashboard**: Giao diện CRUD tài khoản người dùng, cấu hình Role và theo dõi Service Health.

---

### 4. ĐỀ XUẤT KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO (NEXT STEPS)

Để hoàn thiện dự án một cách khoa học, chúng tôi đề xuất triển khai các công việc theo thứ tự ưu tiên sau:

1. **Giai đoạn 1 (Tích hợp API cơ bản)**: Kết nối dữ liệu thực tế cho Series và Chapters trước tiên để đảm bảo luồng khởi tạo dữ liệu hoạt động trơn tru.
2. **Giai đoạn 2 (Hoàn thiện luồng Studio)**: Triển khai chi tiết trang Task, tích hợp API kéo danh sách task của Assistant và luồng nộp bài (Submission) kèm duyệt bài của Mangaka.
3. **Giai đoạn 3 (Công nghệ cốt lõi)**: Thiết kế trình Annotation Editor Canvas cơ bản (chỉ cần vẽ khung hình chữ nhật và lưu tọa độ).
4. **Giai đoạn 4 (Phân quyền & Hoàn thiện)**: Thiết kế riêng biệt 4 màn hình Dashboard và hoàn thiện hệ thống quản trị của Admin.
