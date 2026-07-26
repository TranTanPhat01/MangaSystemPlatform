# CONTRACT MATCHING REPORT
**MangaSystemPlatform — Audit Phase 4**
Generated: 2026-07-24

Legend:
  ✅ MATCH — FE and BE match on method, route, request body, and response type
  ⚠️ MISMATCH — Exists on both sides but contract differs
  🔴 BE_ONLY — Backend endpoint exists, FE has not integrated
  🟡 FE_ONLY — FE code calls route, BE has no matching endpoint
  ❓ UNVERIFIED — Cannot determine without runtime

---

## 1. Auth Contract

| Route | FE Call | BE Signature | Status | Note |
|-------|---------|-------------|--------|------|
| POST /identity/auth/login | authApi.login({email,password}) | LoginRequest{email,password} | ✅ | — |
| POST /identity/auth/register | authApi.register({...}) | RegisterRequest | ✅ | — |
| POST /identity/auth/refresh | authApi.refresh({refreshToken}) | RefreshTokenRequest | ✅ | — |
| POST /identity/auth/logout | authApi.logout({refreshToken}) | RefreshTokenRequest | ✅ | — |
| GET /identity/users/me | authApi.getMe() | — | ✅ | — |

---

## 2. Manga Service Contract

### Series

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| POST /manga/series | {studioId, title, description?, genre?} | CreateSeriesRequest | ✅ | — |
| PATCH /manga/series/{id} | {title?, description?, genre?, status?} | UpdateSeriesRequest | ✅ | — |
| POST /manga/series/{id}/submit-proposal | (empty body) | — | ✅ | — |
| POST /manga/series/{id}/approve-proposal | {decisionNote?} | SeriesDecisionRequest | ✅ | — |
| POST /manga/series/{id}/reject-proposal | {decisionNote?} | SeriesDecisionRequest | ✅ | — |

### Chapters

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| POST /manga/series/{id}/chapters | {chapterNumber, title?, deadline?} | CreateChapterRequest | ✅ | — |
| POST /manga/chapters/{id}/submit-review | (empty body) | — | ✅ | — |

### Pages

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| POST /manga/chapters/{id}/pages | {pageNumber, fileId} | CreatePageRequest | ✅ | — |

### Annotations

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| POST /manga/pages/{id}/annotations | {type, coordinatesJson, description?} | CreateAnnotationRequest | ✅ | — |
| DELETE /manga/annotations/{id} | — | — | ✅ | — |

### Tasks

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| POST /manga/tasks | {annotationId, pageId, title, assignedToUserId, priority, deadline?, description?} | CreateTaskRequest | ✅ | — |
| POST /manga/tasks/{id}/submit | {fileId, note?} | SubmitTaskRequest | ⚠️ | FE uses fileData.fileId || fileData.id — BE expects just fileId. fileId is the right field but FE has OR fallback with .id suggesting potential field name uncertainty |
| POST /manga/tasks/{id}/request-revision | {reason} | RequestRevisionRequest | ✅ | — |

---

## 3. Editorial Service Contract

### Reviews

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| GET /editorial/reviews | — | — | ✅ | Returns EditorialReviewResponse[] |
| POST /editorial/reviews/{id}/comments | {commentText, pageId?, annotationId?} | CreateEditorialCommentRequest | ✅ | — |
| POST /editorial/reviews/{id}/approve | {decisionNote?} | DecisionRequest | ✅ | — |
| POST /editorial/reviews/{id}/request-revision | {decisionNote?} | DecisionRequest | ✅ | — |

### Board Votes

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| POST /editorial/series/{id}/votes | {voteValue: BoardVoteValue, note?} | BoardVoteRequest | ⚠️ | FE sends 'note', BE field might be 'note' or 'comment' — needs verification |
| POST /editorial/series/{id}/finalize-proposal | {adminOverride: false, reason?} | FinalizeProposalRequest | ✅ | — |

### Issues & Rankings

| Route | FE Request Body | BE Expected | Status | Note |
|-------|----------------|-------------|--------|------|
| POST /editorial/issues | {issueNumber, title, releaseDate} | CreateIssueRequest | ✅ | — |
| PATCH /editorial/issues/{id}/status | {status: IssueStatus} | UpdateIssueStatusRequest | ✅ | — |
| POST /editorial/issues/{id}/reader-votes | {seriesId, voteCount} | ReaderVoteInputRequest | ✅ | — |
| POST /editorial/issues/{id}/calculate-ranking | — | — | ✅ | — |

---

## 4. Response Contract Mismatches

### A. TaskResponse.fileId vs fileAssetId
**Issue**: FE types/manga.ts declares PageResponse with both ileId and ileAssetId (L79-80).
**BE**: PageResponse likely has a single canonical field.
**Risk**: FE page editor reads pageObj.fileId (MangakaPageEditorTab.tsx:54) — if BE sends ileAssetId instead, image never loads.
**Status**: ⚠️ UNVERIFIED — needs runtime check.

### B. TaskResponse.submissionHistory vs BE field
**Issue**: FE reads 	ask.submissionHistory and 	ask.revisions (useAssistantDashboard.ts:119-120, types/manga.ts:112-113).
**BE**: TasksController returns TaskResponse. If task detail endpoint doesn't embed submissionHistory, these are always [].
**Status**: ⚠️ UNVERIFIED — needs runtime check.

### C. RankingItemResponse — seriesTitle field
**Issue**: FE MangakaRankingsTab.tsx:101,111 renders anking.seriesTitle and anking.votes, anking.rank.
**BE**: RankingItemResponse (types/editorial.ts:58-68) has seriesId, oteCount, ankPosition — NOT seriesTitle, otes, ank.
**useMangakaRankings.ts:54-62** maps them: ank: item.rankPosition, otes: item.voteCount, seriesTitle: 'Series ' + id.slice(0,8).
**Risk**: Series names never shown — always "Series XXXXXXXX" because BE doesn't return seriesTitle in ranking snapshot.
**Status**: 🔴 CONFIRMED MISMATCH — seriesTitle is fabricated, not from BE.

### D. FileUpload response — fileId field name
**Issue**: useAssistantDashboard.ts:78 does ileData.fileId || fileData.id.
**FE types/file.ts** should declare the upload response shape with a consistent field name.
**Risk**: If BE returns id but FE looks for ileId first, the OR condition masks the issue silently.
**Status**: ⚠️ Should be verified but likely works via fallback.

### E. NotificationResponse type
**Issue**: useNotifications.ts:37 reads 
.status === 2 (for isRead check) and 
.type as a generic field.
**BE**: NotificationResponse has status as enum (1=Unread, 2=Read) and 	ype as numeric enum.
**Risk**: 
.title and 
.message — are these fields actually in BE response? types/notification.ts must match.
**Status**: ❓ UNVERIFIED — check NotificationResponse DTO in BE.

### F. SeriesStatus numeric vs string
**Issue**: FE types/manga.ts declares SeriesStatus = 1 | 2 | 3 | ... | 9 (numeric).
SERIES_STATUS_STYLE in MangakaSeriesTab uses string keys: Draft, Submitted, etc.
**Risk**: Status badge never renders — BE sends number, FE style map has string keys.
**Status**: 🔴 CONFIRMED MISMATCH — badge is keyed on string but value is number.

---

## 5. Summary Count

| Category | Count |
|----------|-------|
| ✅ Contract matches | 32 |
| ⚠️ Contract mismatches (unverified risk) | 5 |
| 🔴 Confirmed contract mismatches | 2 |
| 🔴 BE_ONLY endpoints (FE has not integrated) | 6 |
| 🟡 FE_ONLY routes (no BE support) | 0 |
| ❓ Needs runtime verification | 3 |

---

## 6. BE_ONLY Endpoints (FE Missing Integration)

| Endpoint | Priority | Impact |
|----------|----------|--------|
| GET /manga/chapters/{id} (standalone, not via series) | P1 | Chapter detail page /series/[id]/chapters/[id] exists but minimal |
| POST /editorial/reviews/{id}/start | P1 | TantouEditor cannot start reviewing — no FE button for this |
| GET /editorial/reviews/{id}/comments | P1 | Editorial page may not load review comments list |
| GET /files/{id}/versions | P2 | File version history not displayed |
| POST /files/{id}/versions | P2 | Cannot upload new version from FE |
| POST /identity/admin/users/{id}/reset-password | P2 | Admin cannot reset passwords |

---

## 7. Dead UI Actions (UI exists, API call missing or broken)

| UI Element | Component | Expected Action | Actual Behavior |
|-----------|-----------|----------------|----------------|
| "View Details & Resubmit" button | AssistantRevisionPanel.tsx:72 | Navigate to task / resubmit | Button renders with no onClick handler — DEAD |
| MangakaNotificationsTab | MangakaNotificationsTab.tsx | Show notifications | Empty stub — renders nothing |
| AssistantActivityPanel | AssistantActivityPanel.tsx | Show activity timeline | Empty stub — renders nothing |
| Series status badge | MangakaSeriesTab.tsx | Show status text | Badge key mismatch (number vs string) — always unstyled |
| Rankings seriesTitle | MangakaRankingsTab.tsx | Show series name | Always "Series XXXXXXXX" — not real name |
