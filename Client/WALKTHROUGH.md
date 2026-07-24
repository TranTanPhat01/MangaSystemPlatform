# MangaSystemPlatform — Live Test, Fix & Verification Walkthrough
**Ngày:** 24/07/2026 | **Môi trường:** localhost:3000 (FE) + localhost:5200 (BE)

---

## 🎯 Báo cáo kiểm thử & Fix vai trò TANTOU EDITOR

### 1. Phân tích Yêu cầu BRD vs. Thực tế

| # | Yêu cầu BRD | Mã | FE State | API BE Mapping | Test Kết Quả Thực Tế |
|:---:|:---|:---:|:---:|:---:|:---:|
| 1 | Mangaka Nộp Chapter Cho Biên Tập Review | BR-FR-14 | ✅ Fixed | `POST /manga/chapters/{id}/submit-review` | **PASS (Status 1 → Status 3)** |
| 2 | Event Bus đồng bộ giữa các microservices | BR-19 | ✅ Active | RabbitMQ (`ChapterSubmittedForReviewEvent`) | **PASS (Auto-created Review record)** |
| 3 | TantouEditor xem Review Queue | BR-FR-37 | ✅ Rebuilt | `GET /editorial/reviews` | **PASS (Reviews queue loaded)** |
| 4 | TantouEditor Claim & Start Review | BR-09 | ✅ Integrated | `POST /editorial/reviews/{id}/start` | **PASS (Status: Pending → InReview)** |
| 5 | TantouEditor Thêm Comment Biên Tập | BR-FR-39 | ✅ Integrated | `POST /editorial/reviews/{id}/comments` | **PASS (Comment saved & retrieved)** |
| 6 | TantouEditor Duyệt Chapter (Approve) | BR-FR-40 | ✅ Integrated | `POST /editorial/reviews/{id}/approve` | **PASS (Status: Approved)** |
| 7 | Hàng Đội & Bảng Bảng Xếp Hạng Thực Tế | BR-FR-50 | ✅ Rebuilt | `GET /editorial/issues` & `/rankings` | **PASS (Real API integrated, Mock data removed)** |

---

## 🧪 Kết quả Thực Thi Automated E2E Test Suite (Script Run Output)

```text
=== TANTOU EDITOR E2E WORKFLOW TEST ===

1. Logging in as Mangaka (mangaka_test@gmail.com)...
   Mangaka Token acquired successfully.
1b. Checking Studio... Studio ID: 8720b25e-065c-4bac-8cc6-404974687bb5
2. Fetching Mangaka Series... Series ID: 35481a04-1c7d-4b75-860a-dc236ca6c26b
3. Creating a new test Chapter for review... Created Chapter ID: 8d73c604-1a04-4d5d-9b49-996bb7d22f5c (Number: 1604)
4. Submitting Chapter for Editorial Review... Submit Result: SUCCESS
   Waiting 3 seconds for RabbitMQ event bus processing...
5. Logging in as TantouEditor (editor_test@gmail.com)... Token acquired.
6. Fetching Editorial Reviews Queue as TantouEditor...
   Total Reviews in Queue: 2
   ✅ SUCCESS: Target Review Found in Queue! ID: bbdd7906-8155-4341-a85f-e14605ff132d, Status: Pending
7. Testing Start Review... PASS (Status updated to InReview)
8. Testing Add Comment... PASS (Editorial Comment inserted)
9. Testing Approve Review... PASS (Chapter approved & finalized)
10. Fetching Editorial Issues & Rankings... Found Issues Count: 1
=== E2E WORKFLOW TEST COMPLETED — 100% PASS ===
```

---

## 🛠️ Các Đơn Vị Code Đã Được Refactor & Fix

1. **`MangakaChaptersTab.tsx`**:
   - Khắc phục map status enum giữa FE & BE (`Draft`, `InProduction`, `RevisionRequired`).
   - Cung cấp nút `Submit for Review` kích hoạt flow review chính xác.

2. **`app/editorial/page.tsx`**:
   - Xóa bỏ 100% hardcoded Mock Data trong phần `Weekly Popularity Rankings`.
   - Kết nối trực tiếp API `editorialApi.getIssues()` và `editorialApi.getRankings(selectedIssueId)` với giao diện selector issue linh hoạt.

3. **`TantouEditorDashboard.tsx`**:
   - Fix nút Manage chuyển hướng tới route `/editorial` kèm mô tả empty-state hướng dẫn sử dụng rõ ràng.

---

## ⚙️ Các Cải Tiến Robustness & Fix Starvation Vừa Thực Hiện

### 1. Giải quyết Starvation/Treo System Health
- **Axios Timeout**: Thêm thuộc tính `timeout: 10000` (10 giây) vào cấu hình global Axios client (`lib/api.ts`) nhằm tránh request bị treo vô hạn.
- **Request Cancellation**: Tích hợp `AbortController` vào `SystemHealth.tsx`. Khi có request mới (do đổi interval hoặc click Force Refresh), request cũ chưa hoàn thành sẽ bị abort ngay lập tức.
- **Dynamic Polling**: Thay thế hoàn toàn `setInterval` bằng cơ chế sử dụng `setTimeout` thông minh. Thời điểm lên lịch cho chu kỳ tiếp theo được thiết lập ngay khi request bắt đầu, đồng thời cơ chế hủy request cũ triệt tiêu tình trạng dồn ứ (request starvation).

### 2. Giữ nguyên Cảnh báo Stale trong lúc Refresh
- Tránh việc xóa `errorMsg` ngay đầu hàm `fetchHealthData`. Trạng thái lỗi cũ (nếu có) sẽ được giữ lại trên giao diện cho đến khi có phản hồi mới từ server để tránh mất cảnh báo trong các khoảng thời gian chờ đợi phản hồi chậm.

### 3. Khắc phục lỗi `getVoteSummary` xóa sạch tóm tắt cũ
- Sửa đổi hook `useBoardDashboard.ts`: Khi một series gặp lỗi tải tóm tắt biểu quyết (`getVoteSummary`), hệ thống sẽ giữ lại thông tin biểu quyết cũ đã tải (không xóa trắng toàn bộ).
- Thiết lập trạng thái `error` cảnh báo hệ thống đang chạy ở chế độ degraded (`Một số tóm tắt biểu quyết không thể tải và có thể đã cũ (degraded).`) và trả về `false` để cảnh báo giao diện.

---

## 📊 Summary Unit Test Cases (Vitest Results)

Tất cả **88 test cases** đã vượt qua thành công:
```text
 Test Files  20 passed (20)
      Tests  88 passed (88)
   Start at  09:39:50
   Duration  13.13s
```
- Đã bổ sung test case xác thực cơ chế trả về `false` và giữ lại tóm tắt cũ khi API `getVoteSummary` gặp lỗi trong `__tests__/p1-board-hook.test.tsx`.
- Test case kiểm thử sequence overwrite chống ghi đè dữ liệu cũ trong `__tests__/admin.test.tsx` đã hoạt động hoàn toàn chính xác với cơ chế AbortController.
