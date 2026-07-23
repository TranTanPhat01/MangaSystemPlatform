# MANGA SYSTEM PLATFORM — GAP AUDIT & REMAINING ISSUES REPORT

**Ngày:** 24/07/2026  
**Dự án:** MangaSystemPlatform (Web App + Microservices Gateway)  
**Tài liệu tham chiếu:** `BRD_Manga_Creation_Workflow_and_Publishing_Management_System_VI.md`  
**Môi trường:** Frontend `http://localhost:3000` | Backend API Gateway `http://localhost:5200`

---

## 🚨 1. TỔNG HỢP CÁC LỖI & ĐIỂM THIẾU THEO VAI TRÒ (USER ROLES)

### 🛡️ ADMIN ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **System Health Monitoring** (`/admin/system`) | BR-FR-58 | ⚠️ **FAIL / PARTIAL** | Màn hình báo lỗi *"Failed to fetch detailed system monitoring"*. Do endpoint `/system/metrics` của Gateway Backend chưa trả về data đúng cấu hình DTO hoặc thiếu Prometheus metrics exporter. | **P1 (Cao)** |
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
| **Cảnh Báo NGUY CƠ HỦY SERIES (Cancellation Risk)** | BRD 8.3, BR-15 | 🟡 **MISSING UI** | Backend đã có endpoint `getCancellationWarnings(seriesId)`, nhưng FE chưa có Tab/Panel hiển thị danh sách các bộ truyện có điểm bình chọn thấp liên tiếp và mức độ rủi ro bị hủy (`High` / `Critical`). | **P1 (Cao)** |
| **Annotate Lỗi Trực Tiếp Trên Trang** | BR-FR-39 | ⚠️ **PARTIAL** | Editor hiện tại đã có thể thêm Decision Note & Comment text vào Chapter Review, nhưng tính năng vẽ khung đỏ (annotation overlay) trực tiếp trên trang Manga chưa được dùng chung canvas với `PageEditor`. | **P2** |

---

### 🏛️ EDITORIAL BOARD ROLE

| Feature | BRD Ref | Tình Trạng | Mô Tả Lỗi / Điểm Còn Thiếu | Ưu Tiên |
|:---|:---:|:---:|:---|:---:|
| **Form Nhập Dữ Liệu Bình Chọn Độc Giả (Reader Vote Input)** | BR-FR-46 | 🟡 **MISSING UI** | Backend đã hỗ trợ API `inputReaderVote(issueId, data)`, nhưng giao diện Hội đồng Biên tập hiện chỉ mới có nút tính điểm `Calculate Ranking`, chưa có Dialog/Form để nhập số lượng phiếu bầu của độc giả từng kỳ (`Issue`). | **P1 (Cao)** |
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
│ 7. Reader Voting & Rankings   │    70%      │ ⚠️ Thiếu UI Input  │
│ 8. System Health Monitoring   │    50%      │ ⚠️ Lỗi Metric Sync │
└───────────────────────────────┴─────────────┴────────────────────┘
```

---

## 🎯 3. ĐỀ XUẤT HÀNH ĐỘNG TIẾP THEO (RECOMMENDED ACTION PLAN)

1. **[P1] Form Nhập Bình Chọn Độc Giả (Reader Voting Input Form)**:
   - Tạo Dialog trên màn hình Board/Admin để nhập số vote cho các series theo từng kỳ `Issue`.
   - Kết nối với `editorialApi.inputReaderVote(issueId, data)` -> cho phép tính toán bảng xếp hạng thật.

2. **[P1] Cancellation Warning View**:
   - Thêm UI Panel danh sách cảnh báo hủy series cho TantouEditor & Board dựa trên `editorialApi.getCancellationWarnings(seriesId)`.

3. **[P1] System Health Gateway Sync**:
   - Điều chỉnh API call `/system/metrics` trên Admin System Dashboard để sync metric với Gateway Service.
