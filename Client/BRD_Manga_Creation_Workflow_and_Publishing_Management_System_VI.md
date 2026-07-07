# BUSINESS REQUIREMENTS DOCUMENT (BRD)

# HỆ THỐNG QUẢN LÝ QUY TRÌNH SÁNG TÁC VÀ XUẤT BẢN MANGA

**Tên tiếng Anh:** Manga Creation Workflow and Publishing Management System  
**Tên hệ thống:** MangaSystemPlatform  
**Phiên bản tài liệu:** 1.0  
**Ngôn ngữ:** Tiếng Việt  
**Loại tài liệu:** Business Requirements Document  
**Phạm vi:** Web Application + Microservice Backend + Frontend Workflow + Editorial Workflow + Publishing Decision Support  
**Ngày lập:** 07/07/2026  

---

## 1. Mục đích tài liệu

Tài liệu BRD này mô tả yêu cầu nghiệp vụ cho hệ thống **Manga Creation Workflow and Publishing Management System**, một nền tảng hỗ trợ quản lý toàn bộ quy trình sáng tác, sản xuất, biên tập, xét duyệt và xuất bản Manga.

Mục tiêu của tài liệu là làm rõ bài toán kinh doanh, các bên liên quan, phạm vi hệ thống, quy trình nghiệp vụ, nhu cầu của từng vai trò, yêu cầu chức năng ở mức nghiệp vụ, quy tắc kinh doanh, dữ liệu cốt lõi và định hướng triển khai MVP.

Tài liệu này phục vụ cho các nhóm sau:

- Product Owner và Business Analyst để thống nhất phạm vi sản phẩm.
- UI/UX Designer để thiết kế màn hình và workflow phù hợp từng vai trò.
- Frontend Developer để hiểu user flow và cấu trúc màn hình.
- Backend Developer để hiểu domain nghiệp vụ và service boundary.
- Tester/QA để xây dựng test case theo quy trình thực tế.
- Stakeholder và nhóm dự án để đánh giá tính khả thi, độ ưu tiên và giá trị kinh doanh.

---

## 2. Tổng quan hệ thống

**Manga Creation Workflow and Publishing Management System** là một nền tảng web được thiết kế để quản lý toàn bộ vòng đời sáng tác và xuất bản Manga, từ lúc tác giả đề xuất series mới, nộp bản thảo sơ bộ, tạo chapter, upload page, phân công công việc cho trợ lý, kiểm duyệt kết quả, gửi biên tập viên review, trình hội đồng xét duyệt, cho đến khi series được xuất bản, nhập dữ liệu bình chọn độc giả và theo dõi thứ hạng sau phát hành.

Trong quy trình sản xuất Manga truyền thống, một chương truyện thường cần sự phối hợp của nhiều bên: **Mangaka**, **Assistant**, **Tantou Editor** và **Editorial Board**. Các bên này thường phải trao đổi qua nhiều công cụ rời rạc như chat app, email, spreadsheet, cloud storage hoặc công cụ quản lý task chung. Điều này dễ gây nhầm lẫn về phiên bản file, khó kiểm soát deadline, khó theo dõi tiến độ từng trang, từng khung hình và thiếu dữ liệu khi cần đưa ra quyết định xuất bản.

Hệ thống được đề xuất nhằm thay thế cách quản lý rời rạc đó bằng một workspace tập trung. Mỗi series, chapter, page, annotation, task, submission, review, ranking và publication decision đều được quản lý có cấu trúc. Người dùng có thể theo dõi trạng thái công việc theo thời gian thực, nhận thông báo khi có sự kiện quan trọng và truy vết lịch sử xử lý của từng phần việc.

Về mặt sản phẩm, hệ thống không chỉ là nơi lưu trữ file Manga, mà là một nền tảng điều phối workflow chuyên biệt cho ngành sáng tác và xuất bản Manga. Hệ thống giúp tăng tính minh bạch, giảm sai sót, cải thiện phối hợp giữa studio và biên tập, đồng thời hỗ trợ hội đồng biên tập ra quyết định dựa trên dữ liệu thực tế.

---

## 3. Bối cảnh nghiệp vụ

Ngành công nghiệp Manga có quy trình sản xuất phức tạp, đòi hỏi tốc độ cao và sự phối hợp chặt chẽ. Đặc biệt với các series phát hành hàng tuần hoặc hàng tháng, việc chậm một chapter có thể ảnh hưởng đến lịch in, lịch phát hành và hiệu quả thương mại của nhà xuất bản.

Một chapter Manga thường đi qua các bước chính:

1. Mangaka xây dựng ý tưởng, kịch bản hoặc bản thảo sơ bộ.
2. Mangaka tạo chapter và chuẩn bị các page cần hoàn thiện.
3. Mangaka phân chia công việc cho assistant theo từng page hoặc từng vùng trên page.
4. Assistant xử lý phần việc được giao và gửi lại kết quả.
5. Mangaka kiểm tra, phê duyệt hoặc yêu cầu chỉnh sửa.
6. Chapter hoàn thiện được gửi cho Tantou Editor review.
7. Editor đánh dấu lỗi, góp ý nội dung, yêu cầu revision hoặc approve.
8. Editorial Board xem xét series/chapter, quyết định xuất bản hoặc thay đổi lịch phát hành.
9. Sau khi phát hành, dữ liệu bình chọn từ độc giả được nhập vào hệ thống.
10. Hệ thống tổng hợp ranking và cảnh báo nếu series có nguy cơ bị hủy.

Nếu không có hệ thống quản lý chuyên biệt, mỗi bước trên dễ bị tách rời. File có thể nằm ở nhiều thư mục khác nhau, task có thể được giao qua tin nhắn, góp ý của editor có thể nằm trong email, còn ranking và dữ liệu bình chọn có thể được quản lý bằng spreadsheet riêng. Điều này làm giảm hiệu quả làm việc và khiến nhà xuất bản khó đưa ra quyết định nhanh, chính xác.

---

## 4. Vấn đề hiện tại

### 4.1 Vấn đề của Mangaka

Mangaka phải quản lý nhiều công việc cùng lúc: tạo series, chuẩn bị chapter, upload page, giao việc cho assistant, kiểm tra submission, sửa bản thảo, làm việc với editor và theo dõi hiệu quả series sau phát hành.

Các vấn đề thường gặp gồm:

- Khó biết từng page đang ở trạng thái nào.
- Khó biết assistant nào đang xử lý vùng nào trên page.
- Dễ nhầm giữa nhiều phiên bản file.
- Không có nơi tập trung để xem task, submission và feedback.
- Khó theo dõi deadline của từng chapter.
- Không nhận được cảnh báo sớm khi series có ranking thấp hoặc nguy cơ bị hủy.

### 4.2 Vấn đề của Assistant

Assistant thường nhận việc từ nhiều nguồn khác nhau như chat, email hoặc cloud folder. Điều này khiến họ khó theo dõi đầy đủ yêu cầu của từng task.

Các vấn đề thường gặp gồm:

- Không biết task nào đang ưu tiên cao.
- Không biết chính xác vùng nào trên page cần xử lý.
- Khó tìm đúng file hoặc đúng phiên bản page.
- Không có lịch sử rõ ràng cho các lần nộp bài.
- Không biết task nào đã được duyệt, task nào cần sửa.
- Khó theo dõi số lượng page/task đã được approve trong tháng.

### 4.3 Vấn đề của Tantou Editor

Editor cần đảm bảo chất lượng nội dung và tiến độ xuất bản, nhưng thường không có công cụ realtime để theo dõi studio đang làm đến đâu.

Các vấn đề thường gặp gồm:

- Không biết chapter đang chậm ở page nào hoặc task nào.
- Khó đánh dấu góp ý trực tiếp lên page.
- Feedback dễ bị thất lạc nếu gửi qua nhiều kênh.
- Không có dữ liệu tổng hợp để bảo vệ series trước hội đồng.
- Khó theo dõi lịch sử revision và quyết định review.

### 4.4 Vấn đề của Editorial Board

Editorial Board cần đưa ra quyết định xuất bản dựa trên nhiều dữ liệu: chất lượng bản thảo, lịch xuất bản, ranking, dữ liệu bình chọn, feedback từ editor và hiệu suất sản xuất.

Các vấn đề thường gặp gồm:

- Dữ liệu ranking và reader voting bị phân tán.
- Không có bảng tổng hợp tình trạng series.
- Khó nhận diện sớm series có nguy cơ bị hủy.
- Quyết định xuất bản có thể thiếu cơ sở dữ liệu đầy đủ.
- Khó xem lịch sử phát hành và xu hướng thứ hạng của series.

---

## 5. Mục tiêu kinh doanh

Hệ thống cần đạt các mục tiêu kinh doanh sau:

### 5.1 Tập trung hóa quy trình sáng tác và xuất bản

Toàn bộ quy trình từ tạo series, tạo chapter, upload page, giao việc, nộp kết quả, review, approve, xuất bản và ranking cần được quản lý trên cùng một nền tảng.

### 5.2 Tăng khả năng kiểm soát tiến độ

Mangaka, Editor và Board cần theo dõi được trạng thái của từng chapter, từng page, từng task và từng submission. Điều này giúp phát hiện sớm bottleneck và giảm nguy cơ trễ deadline.

### 5.3 Giảm nhầm lẫn file và phiên bản

Hệ thống cần quản lý file theo metadata và version history, đảm bảo người dùng luôn biết file nào là bản mới nhất, file nào đã được duyệt và file nào cần sửa.

### 5.4 Cải thiện phối hợp giữa Mangaka và Assistant

Task cần được gắn với page, annotation, deadline, priority và file liên quan. Assistant cần có workspace rõ ràng để nhận việc và nộp kết quả.

### 5.5 Cải thiện quy trình editorial review

Editor cần có công cụ review chapter, đánh dấu trực tiếp trên page, đưa ra decision và yêu cầu revision một cách có cấu trúc.

### 5.6 Hỗ trợ hội đồng biên tập ra quyết định dựa trên dữ liệu

Editorial Board cần xem được ranking, reader voting, publication history, cancellation warning và recommendation từ editor để ra quyết định tiếp tục, thay đổi hoặc hủy series.

### 5.7 Tạo nền tảng cho AI trong tương lai

Sau khi workflow cốt lõi ổn định, hệ thống có thể mở rộng AI để tự động tô màu page, hỗ trợ nhận diện panel, speech bubble, character region và gợi ý annotation.

---

## 6. Phạm vi hệ thống

### 6.1 Trong phạm vi

Các chức năng sau nằm trong phạm vi của hệ thống:

- Đăng ký, đăng nhập và phân quyền người dùng.
- Dashboard theo từng vai trò.
- Quản lý studio.
- Quản lý series.
- Quản lý chapter.
- Upload và quản lý page/manuscript.
- Tạo annotation trên page.
- Giao task cho assistant từ annotation.
- Assistant xem task, tải file, upload submission.
- Mangaka phê duyệt submission hoặc yêu cầu chỉnh sửa.
- Submit chapter cho editor review.
- Editor review chapter, comment, annotate, approve hoặc request revision.
- Editorial Board xét duyệt series mới.
- Editorial Board quyết định lịch xuất bản.
- Nhập dữ liệu bình chọn độc giả.
- Tổng hợp ranking series.
- Cảnh báo series có nguy cơ bị hủy.
- Notification và realtime update.
- Quản lý file và version.
- Admin quản lý user, role và tình trạng hệ thống.

### 6.2 Ngoài phạm vi MVP

Các chức năng sau chưa nên đưa vào MVP ban đầu:

- AI tự động tô màu page ở mức production.
- AI segmentation tự động hoàn toàn.
- Thanh toán tự động cho assistant.
- Tích hợp trực tiếp với hệ thống in ấn hoặc nhà phân phối.
- Mobile app native.
- Marketplace tuyển assistant.
- Hệ thống thương mại bán Manga cho độc giả.
- Phân tích doanh thu nâng cao.
- Recommendation engine cho độc giả.

Các chức năng này có thể được xem là phase sau hoặc advanced module.

---

## 7. Stakeholders

| Stakeholder | Vai trò | Nhu cầu chính |
|---|---|---|
| Mangaka | Tác giả/chủ series | Quản lý series, chapter, page, task, submission, review và ranking |
| Assistant | Trợ lý sản xuất Manga | Nhận task, tải file, nộp kết quả, theo dõi trạng thái duyệt |
| Tantou Editor | Biên tập viên phụ trách | Review chapter, comment trực tiếp trên page, kiểm soát deadline |
| Editorial Board | Hội đồng biên tập | Xét duyệt series, quyết định xuất bản, theo dõi ranking và cancellation risk |
| Admin | Quản trị hệ thống | Quản lý user, role, service health, log và cấu hình hệ thống |
| Publisher/Studio Manager | Bên quản lý sản xuất/xuất bản | Theo dõi hiệu suất sản xuất, chất lượng và rủi ro chậm deadline |
| Product Owner | Chủ sản phẩm | Định hướng scope, roadmap và giá trị sản phẩm |
| Development Team | Nhóm phát triển | Xây dựng hệ thống theo yêu cầu nghiệp vụ |
| QA/Tester | Kiểm thử | Kiểm tra workflow, role permission, file upload, notification và review flow |

---

## 8. User Roles và nhu cầu nghiệp vụ

## 8.1 Mangaka

Mangaka là người sáng tác và quản lý series. Đây là vai trò trung tâm trong quy trình sản xuất Manga.

### Nhu cầu nghiệp vụ

- Tạo hồ sơ giới thiệu series mới.
- Nộp bản thảo sơ bộ để trình hội đồng xét duyệt.
- Tạo chapter thuộc series.
- Upload page hoặc manuscript.
- Chọn từng vùng trên page và tạo annotation.
- Giao việc cụ thể cho assistant.
- Theo dõi trạng thái từng task.
- Xem submission từ assistant.
- Approve hoặc yêu cầu revision ngay trên page.
- Submit chapter cho editor review.
- Nhận feedback từ editor.
- Theo dõi ranking của series.
- Nhận cảnh báo khi series có nguy cơ bị hủy.

### Giá trị nhận được

Mangaka có thể kiểm soát toàn bộ quy trình sản xuất từ một dashboard duy nhất, giảm nhầm lẫn khi giao việc và tăng khả năng hoàn thành chapter đúng deadline.

---

## 8.2 Assistant

Assistant là người xử lý các phần việc cụ thể do Mangaka giao.

### Nhu cầu nghiệp vụ

- Xem danh sách task được giao.
- Xem deadline, priority và mô tả chi tiết.
- Tải file page và tài nguyên hỗ trợ.
- Xem vùng annotation liên quan đến task.
- Upload kết quả hoàn thành.
- Nhận feedback từ Mangaka.
- Theo dõi task đã được approve hoặc cần revision.
- Theo dõi số lượng page/task đã được duyệt trong tháng.
- Theo dõi thu nhập tương ứng nếu hệ thống hỗ trợ.

### Giá trị nhận được

Assistant có workspace rõ ràng, biết mình cần làm gì, làm trên file nào, nộp ở đâu và trạng thái duyệt ra sao.

---

## 8.3 Tantou Editor

Tantou Editor là biên tập viên phụ trách kiểm tra chất lượng nội dung và khả năng xuất bản của chapter/series.

### Nhu cầu nghiệp vụ

- Xem review queue.
- Xem chapter đang chờ review.
- Mở page và đánh dấu trực tiếp điểm cần sửa.
- Ghi chú về thoại, kịch bản, bố cục, logic và nhịp truyện.
- Approve chapter nếu đạt yêu cầu.
- Request revision nếu cần chỉnh sửa.
- Theo dõi tiến độ hoàn thiện của studio.
- Chuẩn bị dữ liệu để bảo vệ series trước hội đồng.
- Theo dõi series có ranking thấp hoặc có nguy cơ bị hủy.

### Giá trị nhận được

Editor có thể review chính xác hơn, phản hồi rõ ràng hơn và kiểm soát tiến độ publication tốt hơn.

---

## 8.4 Editorial Board

Editorial Board là hội đồng có quyền quyết định xuất bản và định hướng series.

### Nhu cầu nghiệp vụ

- Xem danh sách series mới được đề xuất.
- Bỏ phiếu thông qua hoặc từ chối series mới.
- Quyết định lịch xuất bản hàng tuần hoặc hàng tháng.
- Xem ranking của các series.
- Nhập dữ liệu bình chọn độc giả sau mỗi kỳ phát hành.
- Xem lịch sử xếp hạng của series.
- Ra quyết định tiếp tục, thay đổi hình thức xuất bản hoặc hủy series.
- Xem đề xuất và dữ liệu bảo vệ series từ Tantou Editor.

### Giá trị nhận được

Board có dữ liệu tập trung để ra quyết định xuất bản minh bạch, nhất quán và dựa trên thực tế.

---

## 8.5 Admin

Admin chịu trách nhiệm quản trị hệ thống.

### Nhu cầu nghiệp vụ

- Quản lý user.
- Quản lý role.
- Theo dõi service health.
- Xem log hệ thống.
- Cấu hình quyền truy cập.
- Hỗ trợ xử lý lỗi vận hành.

### Giá trị nhận được

Admin đảm bảo hệ thống hoạt động ổn định, bảo mật và đúng quyền.

---

## 9. Quy trình nghiệp vụ tổng thể

## 9.1 Quy trình tạo và xét duyệt series mới

1. Mangaka đăng nhập vào hệ thống.
2. Mangaka tạo hồ sơ series mới.
3. Mangaka nhập thông tin: tên series, mô tả, thể loại, concept, nhân vật, định hướng nội dung.
4. Mangaka upload manuscript hoặc bản thảo sơ bộ.
5. Mangaka submit series proposal.
6. Tantou Editor hoặc Editorial Board xem proposal.
7. Board bỏ phiếu thông qua hoặc yêu cầu chỉnh sửa.
8. Nếu được duyệt, series chuyển sang trạng thái Approved.
9. Board quyết định publication type: weekly hoặc monthly.
10. Mangaka bắt đầu tạo chapter đầu tiên.

### Kết quả mong muốn

Series được quản lý có cấu trúc ngay từ đầu, có trạng thái xét duyệt rõ ràng và có lịch xuất bản ban đầu.

---

## 9.2 Quy trình sản xuất chapter trong studio

1. Mangaka tạo chapter thuộc series.
2. Mangaka upload các page hoặc manuscript liên quan.
3. Mangaka mở Page Annotation Editor.
4. Mangaka chọn vùng cụ thể trên page.
5. Mangaka tạo annotation cho vùng được chọn.
6. Mangaka tạo task từ annotation.
7. Mangaka giao task cho Assistant.
8. Assistant nhận notification task mới.
9. Assistant mở task detail.
10. Assistant tải file và tài nguyên hỗ trợ.
11. Assistant hoàn thành công việc.
12. Assistant upload submission.
13. Mangaka kiểm tra submission.
14. Mangaka approve hoặc request revision.
15. Khi toàn bộ task/page hoàn thành, chapter sẵn sàng để submit review.

### Kết quả mong muốn

Toàn bộ công việc của chapter được theo dõi rõ ràng theo page, annotation, task và submission.

---

## 9.3 Quy trình review biên tập

1. Mangaka submit chapter for review.
2. Hệ thống tạo Editorial Review.
3. Tantou Editor nhận notification hoặc thấy chapter trong Review Queue.
4. Editor mở Review Detail.
5. Editor xem thông tin chapter và từng page.
6. Editor đánh dấu lỗi hoặc góp ý trực tiếp trên page.
7. Editor thêm comment hoặc decision note.
8. Editor chọn Approve hoặc Request Revision.
9. Nếu approve, chapter chuyển sang Approved.
10. Nếu request revision, chapter quay lại cho Mangaka xử lý.

### Kết quả mong muốn

Quy trình review được chuẩn hóa, có lịch sử quyết định và feedback rõ ràng.

---

## 9.4 Quy trình xuất bản và theo dõi ranking

1. Chapter hoặc series được phát hành theo lịch.
2. Sau kỳ phát hành, Board/Admin nhập dữ liệu bình chọn độc giả.
3. Hệ thống tổng hợp voting data.
4. Hệ thống cập nhật ranking table.
5. Mangaka, Editor và Board xem ranking mới.
6. Nếu series có ranking thấp, hệ thống tạo cảnh báo.
7. Editor có thể chuẩn bị dữ liệu bảo vệ series.
8. Board ra quyết định tiếp tục, thay đổi lịch phát hành hoặc hủy series.

### Kết quả mong muốn

Quyết định xuất bản và hủy series dựa trên dữ liệu ranking, voting và lịch sử performance.

---

## 10. Yêu cầu chức năng nghiệp vụ

## 10.1 Authentication & User Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-01 | Người dùng phải có thể đăng nhập bằng email và password. | High |
| BR-FR-02 | Hệ thống phải phân quyền theo role. | High |
| BR-FR-03 | Sidebar và màn hình phải thay đổi theo role. | High |
| BR-FR-04 | Người dùng phải có thể logout. | High |
| BR-FR-05 | Admin phải có thể quản lý user và role. | Medium |

## 10.2 Series Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-06 | Mangaka phải có thể tạo series mới. | High |
| BR-FR-07 | Series phải có title, description, genre, status và owner. | High |
| BR-FR-08 | Mangaka phải có thể submit series proposal. | High |
| BR-FR-09 | Board phải có thể approve hoặc reject series proposal. | High |
| BR-FR-10 | Board phải có thể chọn publication type cho series. | Medium |

## 10.3 Chapter Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-11 | Mangaka phải có thể tạo chapter thuộc series. | High |
| BR-FR-12 | Chapter phải có deadline, status và progress. | High |
| BR-FR-13 | Chapter phải chứa danh sách page. | High |
| BR-FR-14 | Chapter phải có thể submit cho editorial review. | High |
| BR-FR-15 | Chapter phải cập nhật trạng thái sau khi editor approve hoặc request revision. | High |

## 10.4 Page & Manuscript Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-16 | Người dùng có quyền phải có thể upload page/manuscript. | High |
| BR-FR-17 | Page phải có metadata và version. | High |
| BR-FR-18 | Người dùng phải xem được preview của page. | High |
| BR-FR-19 | Hệ thống phải hỗ trợ file ảnh và tài liệu phổ biến như jpg, png, webp, pdf, psd theo cấu hình. | Medium |
| BR-FR-20 | File binary không được lưu trực tiếp trong database nghiệp vụ. | High |

## 10.5 Annotation Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-21 | Mangaka phải có thể chọn vùng trên page để tạo annotation. | High |
| BR-FR-22 | Annotation phải lưu tọa độ, loại vùng và mô tả. | High |
| BR-FR-23 | Annotation có thể liên kết với task. | High |
| BR-FR-24 | Editor có thể dùng annotation để đánh dấu vùng cần sửa. | Medium |
| BR-FR-25 | Page Editor phải hỗ trợ zoom, pan và overlay annotation. | Medium |

## 10.6 Task Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-26 | Mangaka phải có thể tạo task từ annotation. | High |
| BR-FR-27 | Mangaka phải có thể assign task cho Assistant. | High |
| BR-FR-28 | Task phải có title, description, deadline, priority và status. | High |
| BR-FR-29 | Assistant phải xem được danh sách My Tasks. | High |
| BR-FR-30 | Task phải hỗ trợ trạng thái Todo, In Progress, Submitted, Approved, Revision Required. | High |

## 10.7 Submission Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-31 | Assistant phải có thể upload submission cho task. | High |
| BR-FR-32 | Submission phải lưu file, note, submitter và timestamp. | High |
| BR-FR-33 | Mangaka phải có thể approve submission. | High |
| BR-FR-34 | Mangaka phải có thể request revision cho submission. | High |
| BR-FR-35 | Submission phải hỗ trợ version history. | Medium |

## 10.8 Editorial Review Management

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-36 | Khi chapter được submit, hệ thống phải tạo Editorial Review. | High |
| BR-FR-37 | Editor phải xem được Review Queue. | High |
| BR-FR-38 | Editor phải xem được Review Detail của chapter. | High |
| BR-FR-39 | Editor phải có thể comment hoặc đánh dấu lỗi trên page. | High |
| BR-FR-40 | Editor phải có thể approve hoặc request revision. | High |

## 10.9 Editorial Board & Publication Decision

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-41 | Board phải xem được danh sách series cần xét duyệt. | High |
| BR-FR-42 | Board phải có thể bỏ phiếu thông qua series mới. | High |
| BR-FR-43 | Board phải quyết định lịch xuất bản weekly/monthly. | Medium |
| BR-FR-44 | Board phải xem được ranking và voting data. | High |
| BR-FR-45 | Board phải có thể ra quyết định continue, change publication type hoặc cancel series. | High |

## 10.10 Reader Voting & Ranking

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-46 | Board/Admin phải có thể nhập dữ liệu bình chọn độc giả. | High |
| BR-FR-47 | Hệ thống phải tổng hợp ranking sau mỗi kỳ phát hành. | High |
| BR-FR-48 | Hệ thống phải lưu lịch sử ranking. | High |
| BR-FR-49 | Hệ thống phải cảnh báo series có ranking thấp. | Medium |
| BR-FR-50 | Mangaka và Editor phải xem được ranking của series liên quan. | Medium |

## 10.11 Notification

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-51 | Hệ thống phải tạo notification khi task được assign. | High |
| BR-FR-52 | Hệ thống phải tạo notification khi submission được upload. | High |
| BR-FR-53 | Hệ thống phải tạo notification khi chapter được approve hoặc request revision. | High |
| BR-FR-54 | Hệ thống phải tạo notification khi ranking mới được cập nhật. | Medium |
| BR-FR-55 | Người dùng phải xem được notification và mark as read. | High |

## 10.12 Admin & Monitoring

| Mã | Yêu cầu nghiệp vụ | Độ ưu tiên |
|---|---|---|
| BR-FR-56 | Admin phải xem được danh sách user. | Medium |
| BR-FR-57 | Admin phải thay đổi role người dùng nếu được phép. | Medium |
| BR-FR-58 | Admin phải xem được trạng thái service health. | Low |
| BR-FR-59 | Admin phải xem được log/cảnh báo hệ thống. | Low |
| BR-FR-60 | Admin phải cấu hình quyền truy cập cơ bản. | Medium |

---

## 11. Business Rules

| Mã | Business Rule |
|---|---|
| BR-01 | Chỉ người dùng đã đăng nhập mới được truy cập dashboard và module nghiệp vụ. |
| BR-02 | Người dùng chỉ được thao tác theo quyền của role được cấp. |
| BR-03 | Chỉ Mangaka sở hữu series hoặc thành viên studio hợp lệ mới được tạo chapter/page/task trong series đó. |
| BR-04 | Một task phải thuộc về một chapter hoặc một annotation cụ thể. |
| BR-05 | Assistant chỉ được xem và xử lý task được giao cho mình. |
| BR-06 | Một task chỉ được chuyển sang Submitted khi có submission hợp lệ. |
| BR-07 | Một submission chỉ được approve bởi Mangaka hoặc người có quyền tương đương. |
| BR-08 | Chapter chỉ được submit review khi các điều kiện sản xuất tối thiểu đã hoàn thành. |
| BR-09 | Khi chapter được submit review, hệ thống phải tạo Editorial Review nếu chưa tồn tại. |
| BR-10 | Editor có quyền approve hoặc request revision đối với chapter trong review queue. |
| BR-11 | Khi Editorial Review được approve, trạng thái chapter phải được cập nhật thành Approved. |
| BR-12 | Board có quyền quyết định publication type của series. |
| BR-13 | Reader voting data phải được lưu theo từng kỳ phát hành. |
| BR-14 | Ranking phải được tổng hợp sau khi dữ liệu bình chọn được nhập. |
| BR-15 | Series có ranking thấp liên tiếp phải được đánh dấu cancellation risk. |
| BR-16 | File upload thành công phải tạo metadata và trả về fileId. |
| BR-17 | File binary không được lưu trực tiếp trong database nghiệp vụ. |
| BR-18 | Các hành động approve, reject, revision, cancel phải có lịch sử truy vết. |
| BR-19 | Notification phải được tạo khi có sự kiện quan trọng liên quan đến người dùng. |
| BR-20 | Các event xử lý bất đồng bộ không được xử lý trùng nếu cùng MessageId. |

---

## 12. Data Requirements

## 12.1 Core Entities

### User

Đại diện cho người dùng hệ thống.

Thuộc tính chính:

- UserId
- FullName
- Email
- PasswordHash
- Role
- Status
- CreatedAt
- UpdatedAt

### Studio

Đại diện cho workspace sản xuất Manga.

Thuộc tính chính:

- StudioId
- Name
- Description
- OwnerId
- Members
- CreatedAt

### Series

Đại diện cho một bộ Manga.

Thuộc tính chính:

- SeriesId
- StudioId
- Title
- Description
- Genre
- Status
- PublicationType
- OwnerId
- RankingStatus
- CancellationRiskLevel
- CreatedAt

### Chapter

Đại diện cho một chương truyện thuộc series.

Thuộc tính chính:

- ChapterId
- SeriesId
- Title
- ChapterNumber
- Status
- Deadline
- Progress
- SubmittedAt
- ApprovedAt

### Page

Đại diện cho một trang Manga.

Thuộc tính chính:

- PageId
- ChapterId
- PageNumber
- FileId
- Status
- Version
- CreatedAt

### Manuscript

Đại diện cho bản thảo sơ bộ hoặc tài liệu bản thảo.

Thuộc tính chính:

- ManuscriptId
- SeriesId hoặc ChapterId
- FileId
- Version
- Status
- SubmittedBy
- SubmittedAt

### Annotation

Đại diện cho vùng được chọn trên page.

Thuộc tính chính:

- AnnotationId
- PageId
- Type
- CoordinatesJson
- Description
- CreatedBy
- CreatedAt

### Task

Đại diện cho công việc giao cho assistant.

Thuộc tính chính:

- TaskId
- ChapterId
- PageId
- AnnotationId
- Title
- Description
- AssigneeId
- Priority
- Deadline
- Status
- CreatedBy
- CreatedAt

### Submission

Đại diện cho kết quả assistant nộp.

Thuộc tính chính:

- SubmissionId
- TaskId
- FileId
- Note
- SubmittedBy
- Status
- Version
- SubmittedAt

### EditorialReview

Đại diện cho phiên review của editor.

Thuộc tính chính:

- ReviewId
- ChapterId
- EditorId
- Status
- DecisionNote
- CreatedAt
- ReviewedAt

### Comment / RevisionNote

Đại diện cho feedback hoặc yêu cầu chỉnh sửa.

Thuộc tính chính:

- CommentId
- ReviewId
- PageId
- AnnotationId
- Content
- CreatedBy
- CreatedAt

### Vote

Đại diện cho phiếu biểu quyết của hội đồng.

Thuộc tính chính:

- VoteId
- SeriesId
- BoardMemberId
- Decision
- Reason
- CreatedAt

### ReaderVotingData

Đại diện cho dữ liệu bình chọn từ độc giả.

Thuộc tính chính:

- VotingId
- SeriesId
- PublicationIssue
- VoteCount
- Score
- ImportedBy
- ImportedAt

### Ranking

Đại diện cho thứ hạng series sau mỗi kỳ phát hành.

Thuộc tính chính:

- RankingId
- SeriesId
- Rank
- Score
- PublicationIssue
- CalculatedAt

### Notification

Đại diện cho thông báo gửi đến user.

Thuộc tính chính:

- NotificationId
- UserId
- Type
- Title
- Message
- IsRead
- CreatedAt

---

## 13. Yêu cầu giao diện nghiệp vụ

## 13.1 Login/Register

Mục đích:

- Cho phép người dùng đăng nhập vào hệ thống.
- Cho phép tạo tài khoản nếu được scope cho phép.

Thành phần chính:

- Email
- Password
- Remember session
- Loading state
- Error message
- Redirect theo role sau login

## 13.2 Dashboard

Mục đích:

- Hiển thị tổng quan theo vai trò.

Thông tin cần có:

- Active tasks
- Pending reviews
- Unread notifications
- Deadline gần nhất
- Ranking warning nếu có
- Quick actions theo role

## 13.3 Series List

Mục đích:

- Quản lý danh sách series.

Thành phần chính:

- Table/card list
- Status badge
- Search/filter
- Create Series button
- Ranking summary
- Publication type

## 13.4 Series Detail

Mục đích:

- Xem thông tin chi tiết series và danh sách chapter.

Thành phần chính:

- Series metadata
- Chapter list
- Publication status
- Ranking history
- Cancellation risk
- Actions: create chapter, submit proposal, view board decision

## 13.5 Chapter Detail

Mục đích:

- Quản lý page, task và trạng thái chapter.

Thành phần chính:

- Chapter metadata
- Page grid
- Progress bar
- Task summary
- Submit for Review action
- Review status

## 13.6 Page Annotation Editor

Mục đích:

- Cho phép chọn vùng trên page và tạo task/comment.

Thành phần chính:

- Canvas page preview
- Zoom/pan
- Annotation toolbar
- Region selector
- Task creation modal
- Comment panel
- Layer/overlay controls

## 13.7 Task Board

Mục đích:

- Theo dõi task theo trạng thái.

Thành phần chính:

- Kanban columns
- Todo/In Progress/Submitted/Approved/Revision Required
- Priority badge
- Deadline indicator
- Assignee avatar
- Filter by chapter/page/assistant/status

## 13.8 Task Detail

Mục đích:

- Xem và xử lý task cụ thể.

Thành phần chính:

- Task info
- Related page preview
- Annotation highlight
- Download asset
- Upload submission
- Submission history
- Approve/Request Revision actions

## 13.9 Editorial Review Queue

Mục đích:

- Editor xem các chapter đang chờ review.

Thành phần chính:

- Review list
- Chapter title
- Series title
- Submitted date
- Deadline
- Status
- Filter by status/series/priority

## 13.10 Editorial Review Detail

Mục đích:

- Editor review chapter và đưa ra quyết định.

Thành phần chính:

- Chapter overview
- Page viewer
- Comment/annotation tools
- Revision note
- Approve button
- Request Revision button
- Decision history

## 13.11 Ranking Dashboard

Mục đích:

- Board xem thứ hạng series sau mỗi kỳ phát hành.

Thành phần chính:

- Ranking table
- Series score
- Voting data
- Trend indicator
- Cancellation risk badge
- Publication issue selector

## 13.12 Notification Center

Mục đích:

- Người dùng xem thông báo.

Thành phần chính:

- Notification bell
- Unread count
- Dropdown list
- Mark as read
- Navigate to related item

---

## 14. Non-Functional Business Requirements

| Mã | Yêu cầu |
|---|---|
| NFR-01 | Hệ thống phải phản hồi nhanh với các thao tác nghiệp vụ thông thường. |
| NFR-02 | Giao diện phải có loading state cho các request lâu hơn 300ms. |
| NFR-03 | Upload file phải có giới hạn dung lượng và báo lỗi rõ ràng. |
| NFR-04 | Realtime notification nên đến người dùng trong vài giây khi service online. |
| NFR-05 | Hệ thống phải chống xử lý trùng event trong workflow bất đồng bộ. |
| NFR-06 | Giao diện phải rõ ràng, dễ dùng cho từng role. |
| NFR-07 | Các trạng thái workflow phải được hiển thị bằng badge thống nhất. |
| NFR-08 | Các hành động nguy hiểm phải có confirmation dialog. |
| NFR-09 | Hệ thống phải lưu lịch sử các quyết định quan trọng. |
| NFR-10 | Hệ thống phải có khả năng mở rộng để thêm AI Service sau này. |

---

## 15. Security Requirements

| Mã | Yêu cầu bảo mật |
|---|---|
| SEC-01 | Tất cả endpoint nghiệp vụ phải yêu cầu xác thực. |
| SEC-02 | Người dùng chỉ được truy cập dữ liệu thuộc quyền của mình. |
| SEC-03 | Password không được lưu dạng plain text. |
| SEC-04 | Không log password, access token hoặc refresh token đầy đủ. |
| SEC-05 | File access phải kiểm tra quyền người dùng. |
| SEC-06 | API phải kiểm soát CORS theo frontend origin hợp lệ. |
| SEC-07 | Admin action phải được log để audit. |
| SEC-08 | Approve, reject, revision và cancellation decision phải có audit trail. |

---

## 16. Assumptions

- Người dùng có tài khoản hợp lệ và được gán role đúng.
- Manga production workflow trong MVP tập trung vào web dashboard.
- File upload được quản lý qua File Service hoặc storage service riêng.
- Ranking ban đầu có thể được tính từ dữ liệu nhập thủ công.
- Reader voting data ban đầu được nhập bởi Board/Admin, chưa tích hợp tự động từ hệ thống độc giả.
- AI là optional module và chưa bắt buộc trong MVP.
- Mỗi service backend có thể sở hữu database riêng nếu triển khai theo microservice.
- Notification realtime phụ thuộc vào service realtime như SignalR/WebSocket.

---

## 17. Dependencies

- Identity/Auth service để xác thực người dùng.
- Manga Management service để quản lý studio, series, chapter, page, annotation, task và submission.
- File service để upload/download và quản lý metadata file.
- Editorial service để quản lý review, issue, vote, ranking và publication decision.
- Notification service để lưu và gửi notification.
- Database PostgreSQL cho dữ liệu nghiệp vụ.
- Object storage như MinIO hoặc local storage cho file Manga.
- Message broker như RabbitMQ cho workflow bất đồng bộ.
- Realtime technology như SignalR cho notification realtime.
- Frontend framework như Next.js cho dashboard.

---

## 18. MVP Scope đề xuất

MVP nên tập trung vào workflow cốt lõi, tránh đưa quá nhiều chức năng nâng cao khiến hệ thống khó hoàn thành.

### MVP nên gồm

1. Login/Register và phân quyền role.
2. Dashboard layout chung.
3. Dashboard theo role cơ bản.
4. Series management.
5. Chapter management.
6. Page upload và preview.
7. Annotation editor cơ bản.
8. Task assignment từ Mangaka cho Assistant.
9. Assistant My Tasks.
10. Assistant upload submission.
11. Mangaka approve hoặc request revision.
12. Submit chapter cho editorial review.
13. Editor review queue.
14. Editor approve hoặc request revision.
15. Notification cơ bản.
16. Manual reader voting input.
17. Ranking table cơ bản.
18. Admin user management cơ bản.

### Chưa nên đưa vào MVP

- AI auto-coloring.
- AI segmentation production-ready.
- Tính thu nhập assistant tự động phức tạp.
- Advanced analytics.
- Mobile app.
- Public reader portal.
- Payment system.
- Full cancellation prediction model.

---

## 19. AI Integration — Optional Future Scope

AI có thể được tích hợp sau khi workflow chính đã ổn định.

## 19.1 AI tự động tô màu page

Mục tiêu:

- Hỗ trợ chuyển page Manga đen trắng sang bản màu gợi ý.
- Giúp tăng tốc quá trình sản xuất bản màu hoặc special edition.

Đầu vào:

- Manga page image.
- Color reference nếu có.
- Character palette nếu có.

Đầu ra:

- Colored page draft.
- File version mới để Mangaka kiểm tra.

## 19.2 AI hỗ trợ phân đoạn vùng trên page

Mục tiêu:

- Tự động phát hiện panel, speech bubble, character region, background region hoặc effect region.
- Gợi ý annotation để Mangaka tạo task nhanh hơn.

Đầu vào:

- Manga page image.

Đầu ra:

- Danh sách vùng được detect.
- Mask hoặc bounding box.
- Region type.
- Confidence score.

## 19.3 Research Question

**RQ:** Kiến trúc deep learning nào đạt độ chính xác cao nhất trong việc phát hiện và phân đoạn panel, speech bubble và character region trên trang Manga?

### Sub-RQ1

U-Net, YOLOv8, SAM và các kiến trúc segmentation khác khác nhau như thế nào về độ chính xác segmentation theo các chỉ số IoU, F1-score, Precision và Recall đối với từng loại vùng Manga như panel, speech bubble và character?

### Sub-RQ2

Sự khác biệt về art style trong Manga ảnh hưởng như thế nào đến hiệu năng segmentation của từng kiến trúc?

## 19.4 Gợi ý hướng triển khai AI

- Phase đầu chỉ dùng AI để gợi ý, không tự động quyết định.
- Mangaka phải có quyền chỉnh sửa vùng AI detect.
- Kết quả AI phải được lưu như draft annotation.
- Nên xử lý AI qua job queue để tránh làm chậm request chính.
- Nên lưu model version và confidence score để audit kết quả.

---

## 20. Success Metrics

| Mục tiêu | Chỉ số đo lường đề xuất |
|---|---|
| Giảm nhầm lẫn task | Tỷ lệ task bị làm sai vùng/file giảm theo thời gian |
| Tăng đúng hạn chapter | Tỷ lệ chapter hoàn thành trước deadline |
| Tăng tốc review | Thời gian trung bình từ submit review đến decision |
| Cải thiện visibility | Số lượng user dùng dashboard/task board thường xuyên |
| Giảm thất lạc file | Tỷ lệ submission có version rõ ràng |
| Cải thiện quyết định xuất bản | Board sử dụng ranking/voting data trong decision |
| Cảnh báo rủi ro sớm | Số series được cảnh báo trước khi ranking giảm nghiêm trọng |

---

## 21. Rủi ro nghiệp vụ

| Rủi ro | Mức độ | Giải pháp đề xuất |
|---|---|---|
| Scope quá lớn cho MVP | High | Chia phase rõ ràng, ưu tiên workflow cốt lõi |
| Page Annotation Editor khó triển khai | High | Làm bản basic trước, advanced editor phase sau |
| File dung lượng lớn gây chậm hệ thống | Medium | Dùng storage riêng, upload progress, limit size |
| Người dùng không quen workflow mới | Medium | Thiết kế UI đơn giản, có hướng dẫn theo role |
| Ranking/cancellation rule chưa rõ | Medium | Cho phép nhập thủ công trước, rule nâng cao sau |
| AI segmentation chưa ổn định | Medium | Đưa vào optional, chỉ dùng như suggestion |
| Realtime notification lỗi | Low | Có fallback bằng persisted notification |
| Phân quyền phức tạp | High | Định nghĩa role và permission matrix từ sớm |

---

## 22. Độ ưu tiên triển khai màn hình

| Ưu tiên | Màn hình | Lý do |
|---|---|---|
| 1 | Login/Register | Cần để vào hệ thống và xác định role |
| 2 | App Layout + Sidebar | Nền tảng cho toàn bộ UI |
| 3 | Dashboard theo role | Người dùng cần tổng quan công việc |
| 4 | Series List/Detail | Core workflow của Mangaka |
| 5 | Chapter Detail | Quản lý page và tiến độ chapter |
| 6 | File Upload/Page Preview | Cần cho workflow sản xuất |
| 7 | Task Board/My Tasks | Core collaboration giữa Mangaka và Assistant |
| 8 | Task Detail/Submission | Cần để assistant nộp bài và Mangaka duyệt |
| 9 | Editorial Review Queue/Detail | Cần cho editor workflow |
| 10 | Notification Center | Hỗ trợ workflow realtime |
| 11 | Ranking Dashboard | Cần cho Board decision |
| 12 | Page Annotation Editor nâng cao | Màn hình phức tạp, nên làm sau khi data flow ổn |
| 13 | Admin/Monitoring | Hỗ trợ vận hành |

---

## 23. Gợi ý module hệ thống

## 23.1 Frontend Modules

- Auth Module
- Dashboard Module
- Series Module
- Chapter Module
- Page Viewer Module
- Annotation Editor Module
- Task Module
- Submission Module
- Editorial Review Module
- Ranking Module
- Notification Module
- Admin Module
- File Manager Module

## 23.2 Backend Services

- Identity Service
- Manga Management Service
- File Service
- Editorial Service
- Notification Service
- API Gateway
- Optional AI Service

## 23.3 Event Types đề xuất

- UserRegisteredEvent
- FileUploadedEvent
- TaskAssignedEvent
- TaskSubmittedEvent
- TaskApprovedEvent
- TaskRevisionRequestedEvent
- ChapterSubmittedForReviewEvent
- ChapterApprovedEvent
- ChapterRevisionRequestedEvent
- SeriesApprovedEvent
- ReaderVotingImportedEvent
- RankingUpdatedEvent
- CancellationRiskDetectedEvent

---

## 24. Permission Matrix tổng quan

| Chức năng | Mangaka | Assistant | Tantou Editor | Editorial Board | Admin |
|---|---:|---:|---:|---:|---:|
| Login | Có | Có | Có | Có | Có |
| Tạo series | Có | Không | Không | Không | Có |
| Submit series proposal | Có | Không | Không | Không | Có |
| Approve series | Không | Không | Có một phần | Có | Có |
| Tạo chapter | Có | Không | Không | Không | Có |
| Upload page | Có | Có nếu được giao | Không | Không | Có |
| Tạo annotation task | Có | Không | Không | Không | Có |
| Xem task được giao | Có | Có | Không | Không | Có |
| Upload submission | Không | Có | Không | Không | Có |
| Approve assistant submission | Có | Không | Không | Không | Có |
| Submit chapter review | Có | Không | Không | Không | Có |
| Review chapter | Không | Không | Có | Có thể xem | Có |
| Approve chapter | Không | Không | Có | Có thể xem | Có |
| Nhập voting data | Không | Không | Không | Có | Có |
| Xem ranking | Có | Không | Có | Có | Có |
| Cancel series | Không | Không | Đề xuất | Có | Có |
| Quản lý user | Không | Không | Không | Không | Có |

---

## 25. Kết luận

**Manga Creation Workflow and Publishing Management System** là một hệ thống quản lý workflow chuyên biệt cho quy trình sáng tác và xuất bản Manga. Hệ thống giải quyết các vấn đề lớn trong quá trình phối hợp giữa Mangaka, Assistant, Tantou Editor và Editorial Board, bao gồm quản lý task rời rạc, nhầm lẫn phiên bản file, thiếu visibility về tiến độ, feedback biên tập không có cấu trúc và thiếu dữ liệu khi ra quyết định xuất bản.

Bằng cách quản lý tập trung các thực thể như Series, Chapter, Page, Manuscript, Annotation, Task, Submission, Editorial Review, Vote, Ranking và Notification, hệ thống giúp toàn bộ quy trình sản xuất trở nên minh bạch, có thể theo dõi, có thể audit và dễ mở rộng.

Trong giai đoạn MVP, hệ thống nên tập trung vào các workflow cốt lõi: authentication, series/chapter/page management, annotation cơ bản, task assignment, submission, editorial review, notification và ranking thủ công. Sau khi các workflow này ổn định, hệ thống có thể mở rộng thêm AI segmentation, AI coloring, advanced analytics và automation cho publication decision.

Hệ thống có tiềm năng trở thành nền tảng trung tâm cho studio Manga và nhà xuất bản, giúp tăng tốc độ sản xuất, nâng cao chất lượng biên tập, giảm rủi ro trễ deadline và hỗ trợ quyết định xuất bản dựa trên dữ liệu thực tế.
