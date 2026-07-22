# Product Completion Backlog — FE/BE Mapping Audit

> Audit date: 2026-07-22  
> Scope inspected: `Client` source and `../Server` controllers, DTOs, API Gateway routes, BRD.  
> Status: **NOT fully mapped.** The gateway routes all five service prefixes correctly, but important FE calls use an incompatible HTTP method/path/body, and a substantial part of the implemented BE surface has no FE workflow.

## How to use this backlog

- `P0` blocks a real user flow or will reliably produce an HTTP 4xx/5xx.
- `P1` is needed for the BRD MVP workflow to be complete.
- `P2` is available in BE or required by the BRD but can follow the core workflow.
- Do not mark an item done only because a service function exists. Verify it with a real role, real IDs and a non-mock UI path.

## Executive confirmation

| Area | FE state | BE state | Mapping result |
|---|---|---|---|
| API Gateway | All calls use `NEXT_PUBLIC_API_BASE_URL` | Gateway proxies `/identity`, `/manga`, `/files`, `/editorial`, `/notifications` | Mapped at routing level |
| Authentication | Login/register work through services; cookie/middleware guard exists | Auth endpoints exist | Partial: logout body is wrong; refresh/profile lifecycle is incomplete |
| Series / Chapters / Pages | UI and most service functions exist | CRUD/workflow endpoints exist | Partial: service DTO/method mismatches; no complete detail flow |
| Annotation → Task → Submission | A page shell and task UI exist | Annotation/task/submission endpoints exist | Not complete: annotation editor absent and task creation uses zero GUIDs |
| Editorial review | Queue UI exists | Review endpoints exist | Broken request DTOs and response model mismatch |
| Editorial board / ranking | Board UI exists, many mock fallbacks | Vote, issue, ranking, schedule endpoints exist | Not mapped: FE calls non-existent ranking routes and wrong vote/finalize DTOs |
| Files | Upload/download UI exists; file table starts as mock data | Upload, versions, delete, list endpoints exist | Partial: no initial server list, no delete/version UI, no progress |
| Notifications | Dropdown, API calls, SignalR client exist | REST + hub service exist | Largely mapped; end-to-end hub connection still needs runtime verification |
| Admin / monitoring | Users, manga management, health and audit UI exist | Corresponding endpoints exist | Partial: series data/DTO method issue and unimplemented admin API actions |
| Reader capabilities | No reader UI/service | Favorites, bookmarks, reading history, ratings and comments exist | Entire BE capability is unused by FE |

## P0 — repair API contracts before feature work

- [ ] **P0-01 — Correct `mangaApi.updateSeries`.**
  - FE: `services/manga-api.ts`
  - Current FE call: `PUT /manga/series/{id}` with `CreateSeriesRequest` fields including unsupported `frequency`.
  - BE contract: `PATCH /manga/series/{id}` with `UpdateSeriesRequest { title?, description?, genre?, status? }`.
  - Acceptance: edit series succeeds against a running gateway; add an API-contract test asserting PATCH and body.

- [ ] **P0-02 — Correct logout request.**
  - FE: `services/auth-api.ts`, layout logout handler.
  - Current FE call: `POST /identity/auth/logout` without a body.
  - BE requires `RefreshTokenRequest`.
  - Acceptance: logout sends the stored refresh token, clears local state only after the request (or safely on expired session), and invalidates the BE refresh token.

- [ ] **P0-03 — Correct Editorial Review request DTOs.**
  - FE currently sends `{ content }`, `{ notes }`, `{ reason }`, or no body.
  - BE requires `CreateEditorialCommentRequest { commentText, pageId?, annotationId? }` and `DecisionRequest { decisionNote? }` for approve/request-revision/reject.
  - Acceptance: add comment, approve, reject and request revision work from `/editorial`; feedback displayed is from the BE response.

- [ ] **P0-04 — Correct Editorial Board vote/finalize models.**
  - FE type/call: `{ decision, comment }`; finalize has no request body and uses a proposal ID as the series ID.
  - BE requires `BoardVoteRequest { proposalId?, voteValue, note? }` at `/editorial/series/{seriesId}/votes` and `FinalizeProposalRequest { adminOverride, reason? }`.
  - Acceptance: API types mirror BE, board sends `seriesId`, voting/finalization succeeds, and UI uses the BE summary fields (`approve`, `reject`, `revision`, `abstain`, `total`, `quorumReached`).

- [ ] **P0-05 — Replace the non-existent ranking endpoints in `editorialApi`.**
  - FE calls `/editorial/reader-votes`, `/editorial/rankings/calculate`, `/editorial/rankings`.
  - BE exposes issue-scoped routes: `/editorial/issues/{issueId}/reader-votes`, `/calculate-ranking`, `/rankings`.
  - Acceptance: introduce Issue DTO/service/UI selector and issue-scoped ranking calls; remove the misleading global routes.

- [ ] **P0-06 — Fix publication schedule DTO.**
  - FE omits required `chapterId` and invents `notes`, `isPublished` and related response fields.
  - BE requires `CreatePublicationScheduleRequest { seriesId, chapterId, issueId?, publicationType, scheduledDate }`; response has `status` and `publishedAt`.
  - Acceptance: schedule form selects a real chapter and maps the returned BE fields exactly.

- [ ] **P0-07 — Fix task DTO mapping and remove sentinel IDs.**
  - FE `MangakaTasksTab` posts `00000000-0000-0000-0000-000000000000` as annotation/page/assignee.
  - FE request-revision type uses `revisionNote`; BE requires `{ reason }`.
  - FE task response expects fields such as `assignedToId`, `fileAssetId`, `submittedFileUrl`, which are not in BE `TaskResponse` (uses `assignedToUserId`, `pageFileId`, `latestSubmission`).
  - Acceptance: task is created from a selected saved annotation/page and a selected assistant; approve/revision actions are wired; task list/detail maps BE data without guessed fields.

- [ ] **P0-08 — Align Series DTOs.**
  - FE creation does not supply BE-required `studioId`; FE expects `mangakaId`, `mangakaName`, `frequency`, `coverImageUrl`, `chapterCount`, and non-null `updatedAt`, none of which are in the inspected BE `SeriesResponse`.
  - Acceptance: decide whether to add these fields in BE or remove/derive them in FE; type contracts and UI are consistent.

## P1 — complete the BRD core workflow

- [ ] **P1-01 — Implement a real Series detail → Chapter → Page journey.**
  - Current state: list/create series and a chapter tab exist, but there is no stable detail route/selected-series context that leads through the workflow.
  - Include: studio selection, chapter creation/edit status, pages list, per-page asset attachment and useful empty/error states.

- [ ] **P1-02 — Implement the Page Annotation Editor.**
  - Current state: `MangakaPageEditorTab` only lists page IDs and opens a placeholder modal.
  - BE supports create/list/delete annotations; FE lacks `getAnnotations` and a visual editor.
  - Include: image loading, pan/zoom, rectangle coordinates, annotation create/list/delete, normalized coordinate JSON, and selecting an annotation to create a task.

- [ ] **P1-03 — Complete Assistant submission and Mangaka review flow.**
  - Current state: assistant start/upload/submit is partially wired; Mangaka UI does not present real submissions or call approve/request-revision.
  - Include: task detail, reference asset download/preview, submission history, approval/revision feedback, refresh/invalidation after state change.

- [ ] **P1-04 — Connect chapter submission to editorial-review creation.**
  - Current state: FE calls `POST /manga/chapters/{id}/submit-review`, while Editorial BE has a separate `POST /editorial/reviews` requiring `{ chapterId, seriesId, reviewerUserId? }`.
  - Decision required: confirm an event-driven review is created by BE after chapter submission; if not, implement the orchestration on the authorized server side. Do not let FE guess or duplicate review creation.

- [ ] **P1-05 — Finish Editorial Review details.**
  - Include comments fetched from `GET /editorial/reviews/{id}/comments`, page/annotation references, decision note display, correct DTOs (P0-03), role control and loading/error state.

- [ ] **P1-06 — Eliminate mock fallback as production behavior.**
  - Affected: assistant dashboard/tasks, files, Mangaka dashboard tabs, board ranking/schedule/cancellation panels, editorial ranking side panel.
  - Acceptance: empty API results render an explicit empty state; failures render retryable errors; mock data is only allowed in Storybook/demo/test fixtures and never silently replaces API data.

- [ ] **P1-07 — Load files from BE and implement real asset lifecycle.**
  - Current `useFiles` initializes from `data/mock/files.mock`; `deleteFile` only removes local state.
  - BE provides `GET /files/my`, `DELETE /files/{id}`, `POST /files/{id}/versions`, and version list.
  - Include initial query, delete confirmation, version upload/history, category mapping, server errors and upload progress (`onUploadProgress`).

- [ ] **P1-08 — Implement role-safe navigation and authorization UX.**
  - `/assistant`, `/board`, `/editorial`, `/files`, `/series`, `/tasks` have no middleware role restriction; direct URL access can expose the wrong UI before BE rejects requests.
  - `/board` renders `BoardDashboard`, while the role dashboard imports `EditorialBoardDashboard`; consolidate one canonical screen.
  - Acceptance: route-level role guards, 403 screen, one role-normalization utility, and no default fallback to the Mangaka dashboard for unknown roles.

- [ ] **P1-09 — Finish session lifecycle.**
  - `refresh` and `getMe` are defined but not used to rehydrate/refresh a session; client Zustand persistence and middleware cookie can drift.
  - Acceptance: token refresh/expiry handling, bootstrap profile validation, cookie/store synchronization, logout P0-02 and tests for page reload.

## P2 — implemented in BE but absent/incomplete in FE

- [ ] **P2-01 — Add Editorial Board issue management.** BE provides create/list/detail/status issues; FE has no service or screen. It is required to make voting/ranking P0-05 meaningful.
- [ ] **P2-02 — Add publication schedule publish action.** BE provides `POST /editorial/publication-schedules/{id}/publish`; FE only creates/lists schedules.
- [ ] **P2-03 — Add board cancellation and ranking history.** BE provides per-series `hiatus`, `cancel`, `ranking-history`, `cancellation-warnings`; current cards are mock only.
- [ ] **P2-04 — Add proposal approval/rejection workflow or formally remove it.** BE exposes `/manga/series/{id}/approve-proposal` and `/reject-proposal`; FE never uses these and admin currently tries generic numeric status patches instead.
- [ ] **P2-05 — Add File version upload/delete service methods.** Methods exist in BE but are absent from `file-api.ts`.
- [ ] **P2-06 — Complete Admin capabilities intentionally.** BE exposes user create/update/delete, role CRUD and permission assignment; FE implements list/detail/status/roles/lock/unlock/reset/revoke/audit but not all available actions. Prioritize only BRD-approved functions.
- [ ] **P2-07 — Add Reader product scope or explicitly defer it.** BE supports favorites, bookmarks, progress, continue reading, history, ratings and comments; Client has no reader routes/services/UI. This is a product-scope decision, not an accidental gap.
- [ ] **P2-08 — Validate SignalR notification delivery end-to-end.** REST notification mapping is present; verify `/notifications/hub` negotiation/auth/reconnect through YARP and ensure unread state is reconciled after reconnect.

## Contract/API cleanup checklist

- [ ] Generate or publish OpenAPI from the gateway/services and generate FE types/client from it (or maintain a versioned shared contract package). Current hand-written types have already diverged in several domains.
- [ ] Add one API-contract test for every service method used by UI: method, path, body and required fields.
- [ ] Use one enum serialization convention (string or numeric) across FE/BE. FE currently sends string statuses/priorities while several BE DTOs use C# enums; verify JSON configuration and add tests.
- [ ] Standardize response property names. Editorial FE expects `submittedAt`, `seriesTitle`, `chapterTitle`, `comments`; inspected BE DTO exposes `createdAt`, IDs, `decisionNote`, and `latestComment`.
- [ ] Remove unsafe `any` in API services and components once generated/shared DTOs are in place.

## Quality gates before declaring completion

- [ ] Every BRD MVP flow can be completed with a real role and real data: create studio/series → chapter/page/file → annotation → task → assistant submission → Mangaka decision → chapter review → editorial decision → schedule/issue/ranking.
- [ ] No mock fallback is rendered in production routes.
- [ ] Add E2E coverage for the above flow plus auth/role denial.
- [ ] Add integration coverage against gateway for auth, manga, files, editorial and notifications.
- [ ] Resolve current automated-check execution issue: `npm.cmd test` and `npm.cmd run lint` did not report test/lint results within 60 seconds in this environment (both timed out). Re-run in CI or diagnose worker/process configuration; do not treat this audit as a passing quality gate.

## Verified mapping inventory

### Mapped and used from FE

| Service | FE usage | Verdict |
|---|---|---|
| Identity | login, register, admin list/detail/status/roles/lock/unlock/reset/revoke, audit | Mostly mapped; logout and full session lifecycle require fixes |
| Manga | list/create series, chapters list/create, pages list/create, task list/start/submit, chapter submit review | Partial; P0 DTO/method issues and core UI gaps remain |
| File | upload, list in Mangaka tab, download | Partial; files screen uses mock initial data and lifecycle incomplete |
| Editorial | review list/start/comment/decision, proposal/schedule/board actions | Contract-broken in several calls |
| Notifications | list/count/read/read-all/delete and SignalR client | REST mapped; hub needs runtime verification |
| Monitoring | service summary and detailed overview | Mapped, subject to role/production gateway verification |

### BE endpoints with no corresponding FE workflow

| Domain | Examples |
|---|---|
| Reader | favorites, bookmarks, progress, continue-reading, history, ratings, series/chapter comments |
| Editorial issues/rankings | issue CRUD/status, issue reader-votes, issue ranking calculation/list |
| Board operations | hiatus, cancel, ranking history, cancellation warnings |
| File lifecycle | upload a new version, delete asset, version history UI |
| Admin extension | create/update/delete user, role CRUD, role permissions |
| Manga workflow extension | page/chapter status update, annotation list, task detail/approve/revision, series proposal approve/reject |

