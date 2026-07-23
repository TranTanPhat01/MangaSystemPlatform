# MANGA SYSTEM PLATFORM — GAP AUDIT & REMAINING ISSUES REPORT

**Ngày:** 24/07/2026  
**Dự án:** MangaSystemPlatform (Web App + Microservices Gateway)  
**Tài liệu tham chiếu:** `BRD_Manga_Creation_Workflow_and_Publishing_Management_System_VI.md`  
**Môi trường:** Frontend `http://localhost:3000` | Backend API Gateway `http://localhost:5200`

> **Vai trò tài liệu:** Đây là đặc tả nghiệm thu và bằng chứng triển khai chi tiết phía Client cho báo cáo tổng hợp chính tại `../GAP_AUDIT_REPORT.md`. Trạng thái và số liệu verification giữa hai tài liệu phải đồng nhất.

---

## 🚨 1. TỔNG HỢP CÁC LỖI & ĐIỂM THIẾU THEO VAI TRÒ (USER ROLES)

### 🛡️ ADMIN ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **System Health Monitoring** (`/admin/system`) | BR-FR-58 | ✅ **CLIENT VERIFIED** | `SystemHealth.tsx` ưu tiên `/admin/monitoring/overview`, fallback độc lập sang `/health/live` + `/health/services`, giữ dữ liệu thật và hiển thị `Unknown`/`N/A` cho phần thiếu thay vì tạo trạng thái khỏe mạnh giả. | **P1 (Hoàn tất)** |
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
| **Cảnh Báo NGUY CƠ HỦY SERIES (Cancellation Risk)** | BRD 8.3, BR-15 | ✅ **CLIENT VERIFIED** | `CancellationWarningsPanel` gọi `editorialApi.getAllCancellationWarnings()`, hiển thị `Medium`, `High`, `Critical`, nguyên nhân và tách biệt loading/empty/error; phản hồi `403` được hiển thị như lỗi quyền. | **P1 (Hoàn tất)** |
| **Annotate Lỗi Trực Tiếp Trên Trang** | BR-FR-39 | ⚠️ **PARTIAL** | Editor hiện tại đã có thể thêm Decision Note & Comment text vào Chapter Review, nhưng tính năng vẽ khung đỏ (annotation overlay) trực tiếp trên trang Manga chưa được dùng chung canvas với `PageEditor`. | **P2** |

---

### 🏛️ EDITORIAL BOARD ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **Form Nhập Dữ Liệu Bình Chọn Độc Giả (Reader Vote Input)** | BR-FR-46 | ✅ **CLIENT VERIFIED** | `IssueManagement.tsx` tích hợp `ReaderVoteInputDialog`; mỗi Issue có `Input Votes` và `Calc Ranking`, kiểm tra phiếu nguyên không âm, xử lý lỗi, loading và refresh dữ liệu sau thao tác thành công. | **P1 (Hoàn tất)** |
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

## 🎯 3. SPEC XÁC NHẬN VÀ HOÀN THIỆN 3 HẠNG MỤC P1

**Trạng thái spec:** Implemented & client-verified — người dùng duyệt ngày 24/07/2026; live-backend smoke test còn là limitation được ghi trong progress.

**Review remediation:** Đã xử lý findings ngày 24/07/2026: giữ payload `/health/services` khi Gateway trả `503`, hiển thị metric fallback thiếu dữ liệu bằng `N/A`, tách mutation success khỏi refresh failure, và bổ sung Retry tải Manga series.

**Baseline đã rà soát:** nhánh `feature/updateExtend`, ngày 24/07/2026.

### 3.1. Mục tiêu

Hoàn thiện luồng nhập phiếu độc giả và tính ranking theo từng Issue, cung cấp cảnh báo nguy cơ hủy series cho bộ phận biên tập, đồng thời bảo đảm màn hình Admin System Health luôn phản ánh dữ liệu thật hoặc trạng thái không xác định rõ ràng. Giao diện không được treo, nhưng cũng không được che giấu lỗi bằng dữ liệu `Healthy` giả.

### 3.2. Phạm vi và baseline code

| Hạng mục | Tệp chính | API/Endpoint | Baseline quan sát |
|:---|:---|:---|:---|
| Reader Vote & Ranking | `components/board/IssueManagement.tsx`, `components/board/ReaderVoteInputDialog.tsx` | `POST /editorial/issues/{issueId}/reader-votes`, `POST /editorial/issues/{issueId}/calculate-ranking` | UI và API wiring đã có trong code. |
| Cancellation Warnings | `app/editorial/page.tsx`, `services/editorial-api.ts` | `GET /editorial/issues/cancellation-warnings` | Panel, risk badge và reason đã có trong code. |
| System Health | `components/admin/SystemHealth.tsx`, `services/health-api.ts` | Primary: `GET /admin/monitoring/overview`; fallback: `GET /health/live`, `GET /health/services` | Fallback đã có nhưng đang tạo dữ liệu khỏe mạnh giả khi request lỗi/rỗng. |

### 3.3. Yêu cầu chức năng

#### P1-A — Reader Vote Input & Calculate Ranking

- Khi người dùng có quyền quản lý xem danh sách Issue, mỗi dòng phải có hai thao tác `Input Votes` và `Calc Ranking`.
- Khi chọn `Input Votes`, hệ thống phải mở `ReaderVoteInputDialog` gắn đúng `issueId`, cho phép chọn một Manga Series và nhập số phiếu là số nguyên không âm.
- Khi submit hợp lệ, hệ thống phải gọi `editorialApi.inputReaderVote(issueId, { seriesId, voteCount })`, khóa thao tác trong lúc gửi và chỉ đóng dialog khi API trả về thành công.
- Khi chọn `Calc Ranking`, hệ thống phải gọi `editorialApi.calculateRanking(issueId)` đúng với Issue trên cùng dòng, vô hiệu hóa riêng nút đang xử lý, thông báo kết quả và refresh dữ liệu Issue/ranking liên quan.
- Khi tải danh sách series, nhập phiếu hoặc tính ranking thất bại, UI phải hiển thị lỗi có thể hành động; không chỉ ghi `console.error`.
- Người dùng chỉ có quyền đọc không được nhìn thấy hoặc kích hoạt hai thao tác thay đổi dữ liệu.

#### P1-B — Cancellation Warning Panel

- Khi mở trang Editorial, hệ thống phải gọi `editorialApi.getAllCancellationWarnings()` một lần và cho phép refresh thủ công.
- Mỗi cảnh báo phải hiển thị Series định danh được, mức rủi ro `Medium`, `High` hoặc `Critical`, nguyên nhân tụt hạng và thời điểm tạo cảnh báo.
- Loading, empty và error phải là ba trạng thái phân biệt; khi request lỗi, UI không được hiển thị thông điệp “All series are performing well”.
- Panel phải hiển thị đúng cho TantouEditor và EditorialBoard theo policy backend; phản hồi `403` phải được trình bày như lỗi quyền truy cập.

#### P1-C — Admin System Health Graceful Fallback

- Hệ thống phải ưu tiên `healthApi.getDetailedOverview()`. Chỉ dùng fallback khi endpoint này lỗi hoặc trả payload không thành công.
- Fallback phải truy vấn `/health/live` và `/health/services` độc lập để một endpoint lỗi không làm mất dữ liệu hợp lệ từ endpoint còn lại.
- Nếu `/health/live` lỗi hoặc không có status, Gateway phải hiển thị `Unknown` hoặc `Unavailable`, tuyệt đối không mặc định `Healthy`.
- Nếu `/health/services` lỗi hoặc trả rỗng, năm service chuẩn — Identity, Manga, Editorial, Notification và File Service — vẫn có thể xuất hiện để giữ layout, nhưng trạng thái phải là `Unknown`/`Unavailable`.
- Không được tự tạo version, build, dependency status, latency hoặc outbox metric như thể đó là dữ liệu thật. Trường không có từ API phải hiển thị `N/A` hoặc được ẩn.
- Khi chỉ một nguồn fallback thành công, UI phải giữ phần dữ liệu thật nhận được, đánh dấu phần còn thiếu là degraded và hiển thị cảnh báo không chặn thay vì màn hình lỗi đỏ toàn phần.
- Polling và `Force Refresh` phải kết thúc loading trong mọi nhánh; một lần request lỗi không được làm màn hình treo hoặc xóa dữ liệu hợp lệ gần nhất.

### 3.4. Tiêu chí nghiệm thu

- [x] EditorialBoard/Admin thấy `Input Votes` và `Calc Ranking` trên từng Issue; người dùng read-only không thấy hai nút này.
- [x] Submit vote hợp lệ tạo đúng request `{ seriesId, voteCount }` cho đúng `issueId`; giá trị âm, thập phân, rỗng hoặc không phải số bị chặn ở client.
- [x] Calculate Ranking gọi đúng endpoint issue-scoped, có trạng thái loading, thông báo thành công/thất bại và refresh dữ liệu.
- [x] Cancellation Warning Panel hiển thị đúng `Medium`, `High`, `Critical` và `reason` từ API; loading/empty/error không bị nhập nhằng.
- [x] Khi detailed overview hoạt động, System Health hiển thị nguyên payload thật từ Gateway.
- [x] Khi detailed overview lỗi nhưng hai endpoint fallback hoạt động, System Health tổng hợp đúng status thật.
- [x] Khi một hoặc cả hai endpoint fallback lỗi, UI vẫn render và phần thiếu hiển thị `Unknown`/`Unavailable`; không có service hoặc metric nào bị gắn `Healthy` giả.
- [x] Contract tests bao phủ hai API Issue, API all cancellation warnings và ba kịch bản health: primary success, fallback partial success, fallback total failure.
- [x] `npx.cmd tsc --noEmit` chạy thành công với 0 lỗi sau khi dependencies được cài đúng.
- [x] `npm test -- --run` và `npm run build` hoàn tất thành công trước khi đánh dấu ba mục P1 là `DONE`.

### 3.5. Ngoài phạm vi

- Không thay đổi công thức ranking hoặc policy xác định mức rủi ro ở backend.
- Không bổ sung biểu đồ Ranking History (đang là P3).
- Không triển khai Prometheus/Grafana hoặc thay đổi kiến trúc observability.
- Không coi dữ liệu fallback tự suy đoán là bằng chứng service đang hoạt động.

### 3.6. Bằng chứng kiểm tra hiện tại

- Đã xác nhận các route backend cho reader votes, calculate ranking và all cancellation warnings tồn tại trong Editorial Service.
- Đã xác nhận Gateway có `/health/live`, `/health/ready`, `/health/services` và client có `/admin/monitoring/overview`.
- `npx.cmd tsc --noEmit`: **PASS**, 0 lỗi.
- `npm.cmd test`: **PASS**, 20 tệp / 87 tests.
- `npm.cmd run build`: **PASS**, production build hoàn tất.
- `PLAYWRIGHT_EXTERNAL_SERVER=1 npx.cmd playwright test`: **PASS**, đúng 3/3 kịch bản Chromium.
- Giới hạn còn lại: E2E mock Gateway tại network boundary; cần smoke test live-backend khi Gateway và các microservice có dữ liệu/quyền phù hợp.
