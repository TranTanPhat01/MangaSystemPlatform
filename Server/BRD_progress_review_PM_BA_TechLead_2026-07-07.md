# Bao cao tien do theo BRD - Manga Creation Workflow and Publishing Management System

**Ngay ra soat:** 2026-07-07  
**Pham vi ra soat:** BRD `BRD_Manga_Creation_Workflow_and_Publishing_Management_System_VI.md`, backend `Server`, frontend `Client` o project cha.  
**Vai tro danh gia:** PM, BA, Technical Lead.  
**Nguyen tac:** chi ra soat va bao cao, khong sua code ung dung.

---

## 1. Executive Summary

He thong da co nen tang backend microservices kha day du cho MVP: Identity, Manga Management, File, Editorial, Notification, Gateway, Contracts, Building Blocks, Docker infrastructure va AI service skeleton. Backend build thanh cong va automated tests hien co deu pass.

Trang thai tong quan uoc tinh:

| Hang muc | Tien do uoc tinh | Nhan xet ngan |
|---|---:|---|
| Backend architecture & service foundation | 85% | Clean Architecture, tach DB theo service, gateway, gRPC, event bus da co. |
| Core manga workflow backend | 75% | Series, chapter, page, annotation, task, submission da co API, nhung con thieu enforce role/ownership va proposal workflow ro rang. |
| Editorial & ranking backend | 75% | Review, comment, board vote, issue, publication schedule, reader vote, ranking da co; can bo sung lien ket nghiep vu voi proposal/decision. |
| File service | 80% | Upload, metadata, version, local/MinIO provider da co; can verify runtime voi MinIO va quyen truy cap file. |
| Notification | 65% | Persisted notification va RabbitMQ consumers da co; realtime SignalR backend chua co. |
| Frontend workflow | 30% | Login/register, dashboard role-aware, notification API da co; cac man hinh Series/Tasks/Editorial/Files van dung mock data. |
| Security & authorization | 50% | JWT va `[Authorize]` da co; role matrix va ownership/data access chua enforce chi tiet. |
| DevOps/production readiness | 55% | Infra Docker da co, service Dockerfile le te da co; docker-compose chua chay full app stack, migration startup chua ro. |
| Test coverage | 60% | `dotnet build` pass, `dotnet test` pass 36/36; chua co frontend/e2e/authorization/security/runtime infra tests. |

**Ket luan PM:** MVP backend dang di duoc khoang 65-70%, nhung MVP san sang demo end-to-end chi khoang 45-55% vi frontend nghiep vu con mock va chua co realtime notification.  
**Ket luan BA:** Cac object nghiep vu chinh da duoc model hoa, nhung mot so yeu cau BRD quan trong chua thanh workflow hoan chinh: series proposal approval, role permission matrix, page annotation editor UI, admin user management.  
**Ket luan Technical Lead:** Kien truc tot, build/test xanh, nhung can dong cac gap ve authorization, SignalR, frontend API integration, Docker full-stack va E2E truoc khi coi la MVP hoan tat.

---

## 2. Bang chung da kiem tra

### Build/Test

| Lenh | Ket qua |
|---|---|
| `dotnet build MangaSystemPlatform.Server.sln --no-restore` | Thanh cong, 0 warning, 0 error. |
| `dotnet test MangaSystemPlatform.Server.sln --no-restore` | Thanh cong, 36/36 tests passed. |

### Kien truc hien co

| Thanh phan | Bang chung |
|---|---|
| API Gateway | `gateway/Manga.Gateway`, YARP route cho identity/manga/files/editorial/notifications. |
| Identity Service | Auth register/login/refresh/logout/me, JWT, roles Admin/Mangaka/Assistant/TantouEditor/EditorialBoard. |
| Manga Management Service | Studio, Series, Chapter, Page, Annotation, Task, Submission, Revision. |
| File Service | Upload/download/url/version/my files, local storage va MinIO storage provider. |
| Editorial Service | Review, comment, board vote, issue, publication schedule, reader vote, ranking, cancellation warning. |
| Notification Service | Notification DB, unread count, mark read, delete, RabbitMQ event consumers. |
| Async workflow | RabbitMQ event bus, event contracts, inbox pattern o Manga va Editorial. |
| gRPC internal lookup | Identity/File/Manga gRPC contracts va contract tests. |
| Infrastructure | PostgreSQL, RabbitMQ, Redis, MinIO, Seq trong `docker-compose.yml`. |
| Frontend | Next.js app co auth pages, dashboard, notification dropdown; cac trang nghiep vu chinh con mock. |

---

## 3. Mapping BRD theo nhom chuc nang

| Nhom BRD | Trang thai | Danh gia |
|---|---|---|
| BR-FR-01..05 Authentication & User Management | Partial | Login/register/logout/refresh/me da co. Phan quyen role co trong JWT. Chua thay Admin user/role management UI/API day du. |
| BR-FR-06..10 Series Management | Partial | Tao/list/detail/update series da co. Chua co workflow submit proposal va approve/reject proposal ro rang theo BRD; board vote co nhung chua gan chat voi lifecycle series. |
| BR-FR-11..15 Chapter Management | Mostly implemented backend | Tao/list/detail/status/submit review da co. Chua co progress field/UI ro; can verify luong revision sau editor request revision. |
| BR-FR-16..20 Page & Manuscript/File | Partial to mostly backend | Page API va File Service upload/version/provider da co. Preview UI va lien ket page-file trong frontend chua hoan tat; quyen truy cap file can harden. |
| BR-FR-21..25 Annotation | Partial | Backend luu annotation coordinate/type da co. Annotation mo ta con mong; UI editor zoom/pan/overlay chua thay trong frontend. |
| BR-FR-26..30 Task Management | Mostly implemented backend | Tao task, assign, my tasks, start, submit, approve, request revision da co. Frontend tasks van mock; role/ownership can enforce them. |
| BR-FR-31..35 Submission | Partial | Submission upload bang file id/note va approve/revision backend da co. Version history chu yeu o File Service; can lien ket tot hon voi task submission history. |
| BR-FR-36..40 Editorial Review | Partial to mostly backend | Review queue/detail/comment/approve/request revision/reject backend da co. Frontend editorial van mock; comment tren page can gan voi annotation/page UI. |
| BR-FR-41..45 Board & Publication Decision | Partial | Board vote, issue, schedule, publish, ranking history, warning da co. Chua co man hinh board/proposal workflow dung BRD va chua enforce board role. |
| BR-FR-46..50 Reader Voting & Ranking | Mostly backend | Reader vote, calculate ranking, ranking snapshot/items, warning da co. Frontend ranking dashboard chua thay rieng; visibility theo role chua ro. |
| BR-FR-51..55 Notification | Partial | Persisted notification va mark read da co. Realtime theo BRD/NFR-04 chua co backend SignalR hub; frontend co connector fallback. |
| BR-FR-56..60 Admin & Monitoring | Low to partial | Health endpoint/gateway health aggregation va Seq infra da co. Admin user management, role update, admin audit UI/API chua day du. |

---

## 4. Danh gia theo vai tro PM

### Tien do phase

| Phase | Trang thai | Ghi chu PM |
|---|---|---|
| Foundation backend | Done | Solution, microservices, Clean Architecture, gateway, shared contracts da on. |
| Core domain backend | Mostly done | Du object va API chinh, can dong business rule va permission. |
| Distributed workflow | Mostly done | RabbitMQ + inbox co nen tang tot, can runtime verify voi Docker. |
| Notification | Partial | Luu DB da co, realtime chua co. |
| Frontend integration | Blocker | Core pages con mock, day la blocker lon nhat de demo MVP. |
| Hardening & deployment | Partial | Build/test pass, nhung docker-compose chua full app stack. |

### Rủi ro PM

| Rủi ro | Muc do | Tac dong |
|---|---|---|
| Frontend nghiep vu con mock | High | Khong demo duoc luong end-to-end tu BRD. |
| Permission matrix chua enforce chi tiet | High | De sai nghiep vu va fail security review. |
| SignalR backend chua co | Medium | Notification khong realtime, khong dat NFR-04. |
| Proposal approval workflow chua ro | High | Mot muc tieu BRD cot loi cua board/editorial bi ho. |
| Chua co E2E/runtime test voi Docker | Medium | Build xanh nhung chua chac chay tot full-stack. |

---

## 5. Danh gia theo vai tro BA

### Luong nghiep vu da co nen tang

1. Mangaka tao studio/series/chapter/page/annotation/task.
2. Assistant nhan task, start, submit file.
3. Mangaka approve hoac request revision task.
4. Chapter submit sang editorial review.
5. Editor comment, approve, request revision, reject.
6. Board vote, lap issue/schedule, nhap reader vote, tinh ranking.
7. Notification duoc tao tu event va nguoi dung co the mark read.

### Luong nghiep vu can lam ro/bo sung

| Gap BA | Ly do |
|---|---|
| Series proposal lifecycle | BRD yeu cau Mangaka submit proposal va Board approve/reject, hien code moi co series status update va board vote rieng. |
| Permission matrix theo vai tro | BRD co ma tran ro, backend moi dung `[Authorize]` nhieu hon la policy theo role/ownership. |
| Chapter progress | BRD yeu cau chapter co progress; DTO hien khong thay progress field. |
| Annotation description/task link | Annotation hien luu type/coordinates; BRD can description va co the lien ket task. |
| Editorial comment tren page | Backend co comment page/annotation id, nhung UI editor page chua co. |
| Admin user/role management | BRD MVP co admin basic user management, hien chua thay API/UI day du. |
| Dashboard theo role dung du lieu that | Frontend co role-aware layout, nhung widgets/core data chua goi API. |

---

## 6. Danh gia theo vai tro Technical Lead

### Diem manh

- Clean Architecture kha nhat quan giua cac service.
- Tach database theo bounded context.
- Co gRPC internal contracts va interceptor correlation id.
- Co RabbitMQ EventBus, consumer, retry, inbox pattern cho distributed workflow.
- Co standard API response, global exception handling, Serilog + Seq.
- File Service da co local va MinIO provider.
- Backend build/test pass.

### Diem can harden

| Van de | Khuyen nghi |
|---|---|
| Authorization qua rong | Them policy/role attribute va ownership checks o service layer. |
| SignalR thieu backend | Them `NotificationHub`, route gateway `/notifications/hub`, day notification tu handlers qua hub. |
| Frontend mock data | Tao API client/store cho series/tasks/files/editorial/ranking va thay mock. |
| Docker compose chua full stack app | Them cac service API/gateway/client vao compose hoac runbook ro rang. |
| Migration runtime | Chuan hoa cach apply migrations cho local/demo. |
| Event reliability | Outbox pattern cho publisher la nice-to-have truoc production. |
| File authorization | Dam bao download/url/version chi cho user co quyen tren file/task/page/series. |
| Testing gap | Them API integration tests, authorization tests, frontend build/lint, E2E smoke tests. |

---

## 7. Task can hoan thanh theo thu tu uu tien

### P0 - Bat buoc truoc demo MVP end-to-end

| Thu tu | Task | Owner chinh | Ly do |
|---:|---|---|---|
| 1 | Thay mock data frontend cho Series, Tasks, Editorial, Files bang API that qua Gateway | Technical Lead + Frontend | Khong co buoc nay thi demo BRD chi la giao dien tinh. |
| 2 | Hoan thien role/permission matrix cho endpoint cot loi | Technical Lead + BA | Dam bao Mangaka/Assistant/Editor/Board/Admin dung quyen nhu BRD. |
| 3 | Dong workflow Series Proposal: submit proposal, board queue, approve/reject, publication type | BA + Technical Lead | Day la core workflow dau vao cua he thong. |
| 4 | Tao/hoan thien page upload + preview + link Page voi FileAsset tren frontend | Technical Lead | BRD yeu cau page/manuscript workflow co preview. |
| 5 | Hoan thien Task board/My Tasks/submission UI voi du lieu that | Frontend + PM | Luong Mangaka-Assistant la demo path quan trong. |
| 6 | Hoan thien Editorial review queue/detail UI voi du lieu that | Frontend + BA | Luong review bien tap la core cua BRD. |

### P1 - Can lam truoc khi chot MVP

| Thu tu | Task | Owner chinh | Ly do |
|---:|---|---|---|
| 7 | Them backend SignalR `NotificationHub` va route gateway `/notifications/hub` | Technical Lead | Dat NFR realtime notification; frontend da co connector. |
| 8 | Bo sung annotation editor UI: zoom, pan, overlay, tao annotation tren page | Frontend + BA | BRD yeu cau page annotation editor co tinh tuong tac. |
| 9 | Bo sung field/logic chapter progress neu BA xac nhan bat buoc | BA + Backend | BR-FR-12 yeu cau chapter co progress. |
| 10 | Bo sung admin user management: list user, update role/status, audit basic | Backend + Frontend | Nam trong MVP de xuat cua BRD. |
| 11 | Ranking dashboard dung du lieu that va visibility theo role | Frontend + BA | BRD yeu cau board/editor/mangaka xem ranking lien quan. |
| 12 | Runtime verify MinIO upload/download/public URL bang Docker | Technical Lead/QA | Code da co provider, can chung minh chay that. |
| 13 | Full-stack smoke test script: login -> create series -> chapter -> upload page -> task -> submit -> review -> ranking | QA + Technical Lead | Giam rui ro demo bi dut luong. |

### P2 - Hardening truoc final submission/production-like demo

| Thu tu | Task | Owner chinh | Ly do |
|---:|---|---|---|
| 14 | Them API/gateway/client vao `docker-compose.yml` hoac tao compose profile demo | Technical Lead | Mot lenh dung full system cho demo/cham diem. |
| 15 | Chuan hoa migration startup/runbook migration | Technical Lead | Tranh loi DB moi thieu bang. |
| 16 | Them API integration tests cho controllers va authorization policies | QA + Backend | Hien test chua phu day du HTTP API/permission. |
| 17 | Them frontend build/lint vao checklist CI | Technical Lead | Dam bao UI khong vo khi tich hop API. |
| 18 | Them audit trail ro cho approve/reject/revision/cancel/admin actions | Backend + BA | Dat SEC-07/SEC-08 va trace nghiep vu. |
| 19 | Them rate limiting/circuit-breaker timeout cho Gateway/gRPC clients | Technical Lead | Giam cascading failure va abuse gateway. |
| 20 | Outbox pattern cho publisher event | Technical Lead | Dam bao event khong mat khi DB commit thanh cong nhung RabbitMQ fail. |

### P3 - Future scope sau MVP

| Thu tu | Task | Owner chinh | Ly do |
|---:|---|---|---|
| 21 | AI segmentation/coloring prototype | AI/Technical Lead | BRD xep optional future scope. |
| 22 | Advanced analytics/cancellation prediction | BA/Data | Chua nen chen vao MVP. |
| 23 | Public reader portal/mobile/payment | PM | Ngoai pham vi MVP theo BRD. |

---

## 8. De xuat milestone tiep theo

### Milestone A - Demo workflow that, uu tien 5-7 ngay lam viec

Muc tieu: frontend goi API that cho luong co ban.

Deliverables:
- Login/register da san co, verify lai voi gateway.
- Series list/create/detail tu API.
- Chapter/page upload basic.
- Tasks/My Tasks tu API.
- Editorial queue/detail tu API.
- Notification polling tu API.

### Milestone B - BRD compliance, uu tien 5-7 ngay lam viec

Muc tieu: dong cac gap nghiep vu lon.

Deliverables:
- Role/permission matrix enforce.
- Series proposal approval workflow.
- Annotation editor basic.
- Admin user management basic.
- Ranking dashboard.

### Milestone C - Demo hardening, uu tien 3-5 ngay lam viec

Muc tieu: on dinh demo va giam rui ro runtime.

Deliverables:
- SignalR notification backend.
- MinIO runtime verify.
- Full-stack smoke test.
- Docker/runbook demo.
- Frontend build/lint va backend test checklist.

---

## 9. Ket luan

He thong hien tai co nen tang backend tot va da vuot qua muc skeleton. Nhieu service va entity dung BRD da ton tai, build/test backend deu xanh. Tuy nhien tien do MVP khong nen danh gia chi theo backend, vi BRD la workflow web end-to-end. Gap lon nhat hien nay la frontend nghiep vu con mock, permission matrix chua enforce chi tiet, proposal approval workflow chua ro, va realtime notification chua co backend.

Neu can uu tien de dat demo nhanh, nen tap trung P0 theo thu tu: **Frontend API integration -> Role/ownership authorization -> Series proposal approval -> Page/File preview -> Task workflow UI -> Editorial workflow UI**.
