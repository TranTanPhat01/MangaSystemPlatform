# MANGA SYSTEM PLATFORM — GAP AUDIT & REMAINING ISSUES REPORT

**Ngày:** 24/07/2026  
**Dự án:** MangaSystemPlatform (Web App + Microservices Gateway)  
**Tài liệu tham chiếu:** `BRD_Manga_Creation_Workflow_and_Publishing_Management_System_VI.md`  
**Môi trường:** Frontend `http://localhost:3000` | Backend API Gateway `http://localhost:5200`

> **Vai trò tài liệu:** Đây là báo cáo tổng hợp chính ở cấp repository. Đặc tả nghiệm thu và bằng chứng chi tiết phía Client được duy trì tại `Client/GAP_AUDIT_REPORT.md`; trạng thái và số liệu verification giữa hai tài liệu phải đồng nhất.

---

## 🚨 1. TỔNG HỢP CÁC LỖI & ĐIỂM THIẾU THEO VAI TRÒ (USER ROLES)

### 🛡️ ADMIN ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **System Health Monitoring** (`/admin/system`) | BR-FR-58 | ✅ **CLIENT VERIFIED** | Ưu tiên `/admin/monitoring/overview`, sau đó fallback độc lập sang `/health/live` và `/health/services`. Payload trạng thái thật trong response `503` được giữ lại; dữ liệu service thiếu hiển thị `Unknown`, còn metric outbox không có nguồn hiển thị `N/A`. | **P1 (Hoàn tất)** |
| **Tạo User Trực Tiếp Trên UI** | BR-FR-05 | 🟡 **MISSING** | Admin hiện tại chỉ sửa được Role của User có sẵn qua dialog Edit Roles, chưa có UI Form/Modal để tạo User mới trực tiếp từ giao diện Admin `/admin/users`. | **P2** |
| **System Audit Logs View** | BR-FR-59 | 🟡 **MISSING** | Chưa có màn hình xem lịch sử thao tác hệ thống (Audit Log) cho Admin. | **P3** |

---

### 🎨 MANGAKA ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **Page Binary Upload & Task Preview Sync** | BR-FR-16, 23 | ⚠️ **PARTIAL** | Màn hình `MangakaPageEditorTab` cho phép tạo Annotation & Task, nhưng nếu Mangaka chưa chọn upload ảnh thật cho trang đó thì `pageFileId` bị null làm cho Assistant Task Detail Preview bị khung xám. | **P2** |
| **Notification Realtime Toast** | BR-FR-51..55 | 🟡 **MISSING** | Các sự kiện như Assistant nộp bài hay Editor phê duyệt Chapter chưa tự động bật Toast notification theo thời gian thực (hiện tại phải bấm Refresh hoặc reload trang). | **P3** |

---

### 🖊️ ASSISTANT ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **Assistant Revision Panel** | BR-FR-30, 35 | ⚠️ **PARTIAL** | Màn hình `Revision Requests` của Assistant hiện dùng state giả lập cục bộ trên Client, chưa tích hợp với API truy vết các phiên bản nộp bài cũ. | **P2** |
| **Báo Cáo Thu Nhập (Earnings Estimate)** | BRD 8.2 | 🟡 **MOCK** | Thẻ *"Est. Earnings"* trên Dashboard Assistant là số ước tính giả định trên FE, do Backend chưa có Microservice quản lý tài chính/thanh toán. | **P3** |

---

### 📝 TANTOU EDITOR ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **Cảnh Báo NGUY CƠ HỦY SERIES (Cancellation Risk)** | BRD 8.3, BR-15 | ✅ **CLIENT VERIFIED** | `CancellationWarningsPanel` gọi `getAllCancellationWarnings()`, hiển thị `Medium`, `High`, `Critical`, nguyên nhân, ngày tạo và tách biệt loading/empty/error/403. | **P1 (Hoàn tất)** |
| **Annotate Lỗi Trực Tiếp Trên Trang** | BR-FR-39 | ⚠️ **PARTIAL** | Editor hiện tại đã có thể thêm Decision Note & Comment text vào Chapter Review, nhưng tính năng vẽ khung đỏ (annotation overlay) trực tiếp trên trang Manga chưa được dùng chung canvas với `PageEditor`. | **P2** |

---

### 🏛️ EDITORIAL BOARD ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **Form Nhập Dữ Liệu Bình Chọn Độc Giả (Reader Vote Input)** | BR-FR-46 | ✅ **CLIENT VERIFIED** | Mỗi Issue có `Input Votes` và `Calc Ranking`; dialog kiểm tra phiếu nguyên không âm, có retry tải Manga, và không đảo kết quả mutation thành thất bại khi bước refresh hậu kỳ lỗi. | **P1 (Hoàn tất)** |
| **Lịch Sử Xếp Hạng Series (Ranking History Chart)** | BR-FR-48 | 🟡 **MISSING UI** | Backend có endpoint `getSeriesRankingHistory(seriesId)`, nhưng trên UI chưa có biểu đồ đường biểu diễn biến động thứ hạng qua các kỳ phát hành. | **P3** |

---

## 📊 2. THỐNG KÊ TỶ LỆ HOÀN THÀNH THEO NGHIỆP VỤ BRD

```text
┌──────────────────────────────────────────────────────────────────┐
│                     MODULE COMPLETION STATUS                     │
├───────────────────────────────┬─────────────┬────────────────────┤
│ Hạng mục Nghiệp vụ            │ Tỷ lệ PASS  │ Trạng thái         │
├───────────────────────────────┼─────────────┼────────────────────┤
│ 1. Authentication & User Mgmt │   100%      │ ✅ Đã hoàn thiện   │
│ 2. Series & Studio Mgmt       │    95%      │ ✅ Đã hoàn thiện   │
│ 3. Chapter Production Flow    │    95%      │ ✅ Đã hoàn thiện   │
│ 4. Assistant Task Workflow    │    90%      │ ✅ Đã hoàn thiện   │
│ 5. Editorial Review Workflow  │    95%      │ ✅ Đã hoàn thiện   │
│ 6. Board Voting & Finalize    │    90%      │ ✅ Đã hoàn thiện   │
│ 7. Reader Voting & Rankings   │   100%      │ ✅ Client verified │
│ 8. System Health Monitoring   │   100%      │ ✅ Client verified │
└───────────────────────────────┴─────────────┴────────────────────┘
```

---

## ✅ 3. KẾT QUẢ TRIỂN KHAI 3 HẠNG MỤC P1

1. **Reader Vote Input & Calc Ranking**
   - `ReaderVoteInputDialog` được tích hợp vào từng dòng Issue.
   - `Input Votes` gọi API issue-scoped với `{ seriesId, voteCount }`; `Calc Ranking` gọi `calculateRanking(issueId)`.
   - Có validation, retry tải Manga, loading, feedback và refresh dữ liệu an toàn; response `success:false` giữ nguyên snapshot cũ và trả đúng trạng thái thất bại.
   - Ranking snapshot trả về từ `calculateRanking` được đồng bộ ngay vào Issue đang được chọn.

2. **Cancellation Warning Panel**
   - `CancellationWarningsPanel` dùng route all-warnings và hiển thị đầy đủ risk/reason/date.
   - Loading, empty, error và permission error là các trạng thái riêng biệt.

3. **Admin System Health Graceful Fallback**
   - `/health/live` và `/health/services` được truy vấn độc lập.
   - Response `503` có payload trạng thái được giữ lại để hiển thị service `Unhealthy` thật.
   - Không tạo version/build/dependency/outbox giả; trường không có dữ liệu hiển thị `N/A` hoặc `Unknown`.
   - Polling dùng request sequence để response cũ không thể ghi đè health snapshot mới.

### Bằng chứng kiểm tra

- TDD regression bao phủ error envelope `503`, metric không có nguồn, mutation/refresh tách biệt, ranking-state sync, health request race và permission `403`.
- TypeScript: **PASS**, 0 lỗi.
- Vitest: **PASS**, 20 tệp / 87 tests.
- Production build: **PASS**.
- Playwright E2E: **PASS**, đúng 3/3 kịch bản Chromium.
- E2E mock Gateway tại browser network boundary; live-backend smoke test vẫn được khuyến nghị khi toàn bộ microservice đang chạy.
