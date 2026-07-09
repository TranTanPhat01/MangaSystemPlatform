# Server completion report - 2026-07-08

## Da hoan thien trong dot nay

### 1. Series proposal workflow

- Them API submit proposal: `POST /manga/series/{id}/submit-proposal`.
- Them API approve proposal: `POST /manga/series/{id}/approve-proposal`.
- Them API reject proposal: `POST /manga/series/{id}/reject-proposal`.
- Dung `SeriesStatus` hien co de dieu khien lifecycle:
  - `Draft` -> `Submitted`
  - `Submitted` -> `Approved`
  - `Submitted` -> `Draft` khi reject
- Chi owner duoc submit proposal.
- Chi `EditorialBoard`/`Admin` duoc approve/reject proposal.

### 2. Role restriction cho cac endpoint nghiep vu server

- Manga Management:
  - Tao/update series, submit proposal, tao chapter, submit review, tao page, tao task, approve/revision task.
  - Restrict theo `Mangaka`, `Assistant`, `TantouEditor`, `EditorialBoard`, `Admin`.
- Editorial:
  - Restrict vote, schedule, issue, ranking calculation, review decision/comment theo role phu hop.
- File:
  - Restrict upload/version/delete theo role phu hop.

### 3. Field nghiep vu thieu theo BRD

- Them `Chapter.ProgressPercentage`.
- Them `Annotation.Description`.
- Cap nhat DTO, domain entity, EF configuration va response mapping.
- Tao migration:
  - `20260707171228_AddProgressAndAnnotationDescription`

### 4. Notification realtime backend

- Them SignalR hub:
  - `NotificationHub`
  - endpoint: `/notifications/hub`
- Them realtime publisher:
  - `INotificationRealtimePublisher`
  - `SignalRNotificationRealtimePublisher`
- Notification event handlers se push event `NotificationReceived` toi user tuong ung khi notification moi duoc tao.
- JWT bearer da doc `access_token` tu query string cho SignalR handshake.

### 5. Admin user/role management co ban

- Them Identity admin service:
  - list users
  - update user status
  - replace user roles
- Them API:
  - `GET /identity/users`
  - `PATCH /identity/users/{userId}/status`
  - `PUT /identity/users/{userId}/roles`
- Cac endpoint nay dung policy `AdminOnly`.

## Verification

- `dotnet build MangaSystemPlatform.Server.sln`: passed, 0 warning, 0 error.
- `dotnet test MangaSystemPlatform.Server.sln --no-build`: passed, 36/36 tests.

## Con lai sau dot nay

- Chua lam full ownership/data-scope authorization tren moi object lien quan, moi enforce role chinh va owner submit proposal.
- Chua them Outbox Pattern cho publisher.
- Chua dua tat ca API services vao `docker-compose.yml`.
- Chua them API/E2E tests moi cho cac endpoint vua them.
- Frontend van can tich hop cac API server moi.
