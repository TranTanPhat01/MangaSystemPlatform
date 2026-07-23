# DANH SÁCH CÁC CÔNG VIỆC CẦN ƯU TIÊN VÀ KHẮC PHỤC (PRIORITY CHECKLIST)
**Hệ thống:** MangaSystemPlatform  
**Ngày lập:** 2026-07-23

Dưới đây là bảng phân loại chi tiết các phần việc cần sửa lỗi (Bug Fixes) và các hạng mục cần ưu tiên hoàn thiện (Priority Features) phân chia theo mức độ nghiêm trọng và giá trị vận hành.

---

## 🟥 P0 — CẦN SỬA NGAY (Must Fix)
*Hạng mục lỗi kỹ thuật làm hỏng bộ kiểm thử (test suite) hoặc có nguy cơ gây sập ứng dụng (crash).*

- [x] **P0-01: Khắc phục lỗi Test crash `p1-series-page-contract.test.ts`**
  - **Vị trí lỗi:** `Client/services/file-api.ts:59` và `Client/__tests__/p1-series-page-contract.test.ts`
  - **Vấn đề:** Hàm mock `api.get` trả về `undefined` khiến hàm gọi `fileApi.getFileUrl` bị crash do không thể gọi `.then()` trên giá trị undefined.
  - **Cách sửa:** Sửa hàm mock `api.get` trong test file thành `mockResolvedValue` trả về một cấu trúc AxiosResponse giả lập có chứa trường `data` mong đợi.

- [x] **P0-02: Thêm thuộc tính `disabled` cho nút tạo Task trong `MangakaTasksTab.tsx`**
  - **Vị trí lỗi:** `Client/components/mangaka/MangakaTasksTab.tsx:228`
  - **Vấn đề:** Nút `<button onClick={() => void create()}>Create Task</button>` hiện đang luôn luôn sáng (enabled) dù người dùng chưa điền/chọn form. Điều này gây lỗi test case `task-workflow-ui.test.tsx` (nơi kiểm thử mong đợi nút bị vô hiệu hóa khi form rỗng).
  - **Cách sửa:** Thêm `disabled={!pageId || !annotationId || !assignedToUserId || !title.trim()}` vào thẻ button.

- [x] **P0-03: Thêm an toàn Optional Chaining cho các API responses**
  - **Vị trí lỗi:** `Client/services/file-api.ts` (các hàm như `uploadFile`, `getFileUrl`, v.v.)
  - **Vấn đề:** Truy cập trực tiếp `response.data.data.fileId` hoặc `response.data.data.publicUrl` không qua kiểm tra an toàn sẽ lập tức gây crash ứng dụng nếu server trả về lỗi không có gói `data` (như lỗi 500, 502, 504).
  - **Cách sửa:** Đổi tất cả các chuỗi truy cập dạng `response.data.data` thành `response.data?.data`.

---

## 🟧 P1 — ƯU TIÊN HOÀN THIỆN (High Priority)
*Hạng mục tính năng nghiệp vụ cốt lõi và trải nghiệm người dùng cần làm để hệ thống chạy ổn định.*

- [ ] **P1-01: Kiểm tra liên thông Realtime Notification qua SignalR**
  - **Phạm vi:** Backend `NotificationHub` + Frontend `lib/signalr.ts`
  - **Công việc:** Khởi chạy toàn bộ services qua Docker, kiểm tra runtime xem các event như `TaskAssignedEvent`, `TaskSubmittedEvent` có đẩy thông báo realtime lên Dashboard của Mangaka/Assistant thành công hay không (thành công ở mức mã nguồn, cần chạy kiểm thử thực tế trên container).

- [x] **P1-02: Tích hợp Client-side File Validation & Progress Bar**
  - **Phạm vi:** `Client/components/files/FileUploadDropzone.tsx` & `Client/hooks/useFiles.ts`
  - **Công việc:**
    - Kiểm tra định dạng và dung lượng file (tối đa 20MB) ở phía Client trước khi gửi request upload lên File Service để tránh lãng phí băng thông.
    - Sử dụng callback `onUploadProgress` trong cấu hình Axios để hiển thị thanh tiến trình (%) thực tế khi tải lên tệp tin nặng (PSD, bản vẽ chất lượng cao).

---

## 🟨 P2 — CẢI TIẾN & KHÔNG GIAN SẢN XUẤT (Medium/Low Priority)
*Hạng mục cải tiến nâng cao trải nghiệm (UX) và tối ưu hóa vận hành hệ thống.*

- [x] **P2-01: Tích hợp chuột kéo vẽ Canvas cho Bounding Box**
  - **Phạm vi:** `Client/components/mangaka/MangakaPageEditorTab.tsx`
  - **Công việc:** Thay thế ô nhập tọa độ thủ công bằng công cụ vẽ Canvas. Cho phép Mangaka click và kéo chuột để tự động sinh tọa độ dạng `{x, y, width, height}` lưu vào cơ sở dữ liệu làm thông tin vùng cần Assistant sửa.

- [x] **P2-02: Cấu hình Auto-Apply Migrations khi deploy Docker**
  - **Phạm vi:** `/Server/docker-compose.yml` & Backend Entrypoints (`Program.cs` các service)
  - **Công việc:** Cấu hình để các microservices tự động chạy lệnh migrate database khi container khởi chạy lần đầu tiên, tránh việc phải chạy CLI thủ công trên môi trường Deploy.
