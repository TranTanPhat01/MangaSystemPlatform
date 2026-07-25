# MangaSystemPlatform — Báo cáo kiểm thử workflow Mangaka

**Ngày kiểm thử:** 25/07/2026  
**Phạm vi:** Client, Server, gRPC contract, event workflow, production build và Docker runtime  
**Workflow tham chiếu:** Mangaka proposal → chapter production → assistant revision loop → editorial review → publication → reader ranking

## 1. Kết luận

Toàn bộ test hiện có đã được chạy lại và đều thành công. Khi đối chiếu nghiêm ngặt với từng bước trong sơ đồ, workflow đạt **20 bước PASS và 1 bước PARTIAL**: task được duyệt nhưng `Annotation` chưa có lifecycle/status để đánh dấu `Completed`.

| Hạng mục | Kết quả |
|---|---:|
| Server integration tests | **139/139 PASS** |
| Client unit/contract/UI tests | **88/88 PASS** |
| Client Playwright E2E | **3/3 PASS** |
| Tổng test case tự động | **230/230 PASS** |
| TypeScript type-check | **PASS** |
| Next.js production build | **PASS** |
| Gateway health | **HTTP 200** |
| Docker services | **HEALTHY** |
| Mức khớp workflow hình ảnh | **20 PASS / 1 PARTIAL** |

**Đánh giá tổng thể:** PASS cho các test hiện có ở cấp code, service integration, gRPC contract, event handling và UI regression; PARTIAL khi đánh giá độ khớp tuyệt đối với workflow hình ảnh.

Một giới hạn cần được hiểu rõ: bộ test hiện tại kiểm tra toàn bộ workflow bằng nhiều integration test và UI test ghép lại. Dự án chưa có một test duy nhất tạo người dùng thật cho tất cả role, upload file thật, rồi đi xuyên toàn bộ 21 bước qua Gateway và PostgreSQL trong cùng một scenario.

## 2. Lệnh đã chạy

### Server

```powershell
dotnet test MangaSystemPlatform.Server.sln --no-restore --logger "console;verbosity=minimal"
```

Kết quả:

```text
Passed: 139
Failed: 0
Skipped: 0
Duration: 27 s
```

### Client type-check

```powershell
npx tsc --noEmit
```

Kết quả: exit code 0, không có lỗi TypeScript.

### Client unit/contract/UI tests

```powershell
npm test -- --run
```

Kết quả:

```text
Test Files: 20 passed
Tests: 88 passed
Failed: 0
```

### Client E2E

```powershell
npm run test:e2e
```

Kết quả:

```text
Playwright Chromium: 3 passed
Failed: 0
```

Các scenario UI E2E:

1. Editorial Board nhập reader vote và tính ranking.
2. Tantou/Editorial hiển thị cancellation warning và nguyên nhân.
3. Admin System Health xử lý trạng thái monitoring degraded.

### Production build

```powershell
npm run build
```

Kết quả: compile, TypeScript, page generation và page optimization đều thành công; 21 route được build.

### Runtime health

```text
GET http://localhost:5200/health/live
HTTP 200
```

Các container healthy:

- PostgreSQL
- RabbitMQ
- Redis
- MinIO
- Identity API
- Manga API
- File API
- Editorial API
- Notification API
- Gateway

## 3. Đối chiếu từng bước workflow

| Bước | Nội dung workflow | Thành phần kiểm tra | Kết quả |
|---:|---|---|---:|
| 1 | Login to Mangaka Workspace | Identity/Auth contract tests, role and gateway security tests | PASS |
| 2 | Create series proposal | Series API/client contract và SeriesService | PASS |
| 3 | Submit proposal to Editorial Board | Proposal API contract, trạng thái Draft/RevisionRequested → Submitted | PASS |
| 4 | Board proposal decision | Board vote, quorum, finalize và Manga gRPC bridge | PASS |
| 4a | Approved proposal notification | `SeriesProposalDecidedEvent` từ Board finalize và direct decision | PASS |
| 5 | Create new chapter | Chapter API/service và Client Chapters UI | PASS |
| 6 | Upload manuscript pages | File API + PageService; page bắt buộc có `fileId` hợp lệ | PASS |
| 7 | Select page region and add annotation | Annotation contract, page editor và annotation hook | PASS |
| 8 | Create task and assign assistant | Assistant role validation, priority, deadline và `TaskAssignedEvent` | PASS |
| 9 | Monitor studio task dashboard | Task listing, status mapping và Mangaka task UI | PASS |
| 10 | Receive assistant submission | Submission state và `TaskSubmittedEvent` | PASS |
| 11 | Inspect assistant artwork | Submission history/latest submission và secure file access | PASS |
| 12 | Submission decision | Mangaka authorization và trạng thái Submitted | PASS |
| 13 | Add revision note and return task | Reason bắt buộc, RevisionRequired và revision history | PASS |
| 14 | Mark task/annotation complete | Task chuyển `Approved` và phát `TaskApprovedEvent`; `Annotation` chưa có status/lifecycle `Completed` | **PARTIAL** |
| 15 | All chapter pages/tasks ready | Chặn thiếu page, page không file hoặc task chưa Approved | PASS |
| 16 | Submit chapter for editorial review | `ChapterSubmittedForReviewEvent` và pending review creation | PASS |
| 17 | Tantou review decision | Start review, comments, approve/revision/reject authorization | PASS |
| 18 | Fix narrative/art issues | RevisionRequested → sửa → resubmit và reopen review | PASS |
| 19 | Schedule/publish chapter | Approved review gate, publication schedule và gRPC `PublishChapter` | PASS |
| 19a | Reader publication notification | `ChapterPublishedEvent` và `ReaderChapterNotificationRequestedEvent` | PASS |
| 20 | Monitor reader voting/ranking | Reader votes, ranking calculation và cancellation warning | PASS |
| 21 | End chapter lifecycle | Chapter `Published`, progress 100%, publication persisted | PASS |

## 4. Kiểm tra các nhánh quyết định

### Proposal

- Không cho finalize trước quorum.
- Reject hoặc request revision yêu cầu lý do.
- Finalize thành công cập nhật Manga service qua gRPC.
- Cả Board finalize và API decision trực tiếp đều phát `SeriesProposalDecidedEvent`.

### Assistant task

- Chỉ user có role Assistant mới được giao task.
- Chỉ assistant được giao mới có thể start/submit.
- Submission phải tham chiếu file tồn tại và truy cập được.
- Chỉ task Submitted mới có thể approve hoặc request revision.
- Revision phải có lý do.

### Chapter readiness

- Không thể submit chapter chưa có page.
- Không thể submit nếu page thiếu manuscript file.
- Không thể submit nếu còn task chưa Approved.
- Chapter revision có thể được sửa và submit lại.

### Editorial review

- Tantou chỉ xem pending review hoặc review được giao cho mình.
- Review phải ở trạng thái InReview trước khi quyết định.
- Revision/reject bắt buộc có decision note.
- Approval cập nhật Manga chapter sang Approved qua event.

### Publication

- Chỉ Editorial Board/Admin có quyền schedule và publish.
- Chỉ approved series và approved/reviewed chapter mới được schedule.
- Khi publish, Editorial gọi Manga service qua gRPC.
- Manga service chuyển chapter sang Published, đặt progress 100%.
- Manga service phát `ChapterPublishedEvent`.
- Reader yêu thích series nhận `ReaderChapterNotificationRequestedEvent`.
- Lệnh publish chapter có tính idempotent khi chapter đã Published.

## 5. Runtime và event consumers

Log xác nhận RabbitMQ consumers đã khởi động cho:

- `SeriesProposalDecidedEvent`
- `TaskAssignedEvent`
- `TaskSubmittedEvent`
- `TaskApprovedEvent`
- `ChapterSubmittedForReviewEvent`
- `ChapterReviewDecisionEvent`
- `ChapterApprovedEvent`
- `ReaderChapterNotificationRequestedEvent`
- `RankingCalculatedEvent`
- `CancellationWarningCreatedEvent`

Database migrations không còn pending migration cho Manga, Editorial và Notification database.

## 6. Cảnh báo không chặn release

1. Next.js cảnh báo convention `middleware` đã deprecated và khuyến nghị chuyển sang `proxy`.
2. ASP.NET DataProtection keys đang nằm trong filesystem container và không được persist/encrypt. Nên mount volume hoặc dùng external key store cho production.
3. Các request `/notifications/my`, `/notifications/unread-count` và SignalR negotiate trả 401 khi chưa đăng nhập; đây là hành vi authorization đúng.
4. PowerShell của môi trường hiển thị cảnh báo `Test-Path: Access is denied` khi npm/npx kiểm tra binary toàn cục. Các command vẫn exit code 0 và test/build không bị ảnh hưởng.
5. Log còn một lỗi lịch sử `GET /editorial/series/series-1/vote-summary` do identifier mock `series-1` không phải GUID và request bị hủy. Lỗi không xuất hiện trong lần health check hiện tại, nhưng E2E nên tiếp tục intercept đầy đủ mọi API mock để tránh gọi nhầm runtime Gateway.

## 7. Khoảng trống test còn lại

### 7.1. Khoảng trống nghiệp vụ

`Annotation` hiện chỉ lưu type, coordinates, description và quan hệ task; chưa có trường trạng thái. Vì vậy khi Mangaka approve task:

- Task được chuyển sang `Approved`.
- Submission được chuyển sang `Approved`.
- `TaskApprovedEvent` được phát.
- Annotation liên quan không được chuyển sang `Completed`.

Để khớp 100% bước 14 trong sơ đồ, cần bổ sung annotation lifecycle/status, migration database, DTO/API response và logic chỉ complete annotation khi mọi task thuộc annotation đã được approve.

### 7.2. Khoảng trống system E2E

Để đạt mức system E2E tuyệt đối, nên bổ sung một Playwright/API scenario có dữ liệu thật:

1. Seed/register Mangaka, Assistant, EditorialBoard và TantouEditor.
2. Login từng role qua Gateway.
3. Tạo studio và proposal thật.
4. Board vote/finalize thật.
5. Upload manuscript thật vào MinIO.
6. Tạo annotation/task và assistant submission thật.
7. Mangaka approve/revision thật.
8. Tantou review thật.
9. Schedule/publish thật.
10. Xác nhận notification và ranking trong PostgreSQL/API.

Khoảng trống này không làm fail test hiện tại, nhưng là bước nên làm trước production acceptance test.

## 8. Kết luận release

Workflow hiện tại đủ điều kiện cho **development/integration acceptance**, nhưng chưa nên tuyên bố khớp 100% sơ đồ cho đến khi hoàn tất annotation lifecycle:

- Không có test failure.
- Không có lỗi build.
- Contract Client/Server và gRPC đồng bộ.
- Các decision gate chính trong sơ đồ đã được enforce.
- Docker runtime và Gateway đang healthy.
- Hai phần từng thiếu — proposal notification và publication → reader notification — đã có test regression và đang hoạt động.

Khuyến nghị trước production: hoàn tất annotation lifecycle, bổ sung system E2E xuyên Gateway với dữ liệu và role thật, đồng thời xử lý DataProtection key persistence và cảnh báo Next.js middleware.
