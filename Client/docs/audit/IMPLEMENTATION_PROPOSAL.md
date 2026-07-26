# IMPLEMENTATION PROPOSAL
**MangaSystemPlatform — Audit Phases 5-9**
Generated: 2026-07-24

This document covers:
- Phase 5: Dead UI Audit (confirmed dead actions)
- Phase 6: UI/UX Audit Summary
- Phase 7: Traceability Matrix
- Phase 8/9: Prioritized Implementation Proposal

---

# PHASE 5: DEAD UI AUDIT

## Category A — Backend exists, Frontend NOT integrated

| # | Feature | BE Endpoint | FE Status | Evidence |
|---|---------|-------------|-----------|---------|
| A-01 | Start editorial review | POST /editorial/reviews/{id}/start | NOT integrated | TantouEditorDashboard links to /editorial but no start button before review begins |
| A-02 | Get review comments list | GET /editorial/reviews/{id}/comments | PARTIAL | editorial/page.tsx (41KB) — needs verification if fully wired |
| A-03 | File versioning — upload new version | POST /files/{id}/versions | NOT integrated | No FE UI for version upload. getFileVersions is defined but no UI |
| A-04 | Admin password reset | POST /identity/admin/users/{id}/reset-password | NOT integrated | UserDetailDialog has no reset-password button |
| A-05 | Chapter progress update | PATCH /manga/chapters/{id}/status | PARTIAL | Only submit-review used; chapter progress % not updated from FE |
| A-06 | User sessions revoke | POST /identity/admin/users/{id}/revoke-sessions | NOT integrated | UserDetailDialog — missing action |

## Category B — Frontend has UI, Backend does NOT support

| # | UI Action | Expected BE | Actual | Evidence |
|---|-----------|------------|--------|---------|
| B-01 | (None found) | — | — | All FE API calls map to real BE endpoints |

## Category C — FE and BE both exist but contract doesn't match

| # | Feature | FE Code | BE Contract | Gap |
|---|---------|---------|-------------|-----|
| C-01 | Series status badge style | String key lookup: 'Draft', 'Submitted' | BE sends numeric enum (1,2,3...) | Badge never renders with color — always unstyled |
| C-02 | Ranking series title | ranking.seriesTitle rendered in table | BE RankingItemResponse has no seriesTitle | Always shows "Series XXXXXXXX" (fake truncated ID) |
| C-03 | Submit task fileId | fileData.fileId || fileData.id | BE upload returns field named 'id' based on DTO | OR fallback works but implies field ambiguity |

## Category D — UI action exists but no real behavior

| # | Component | Element | Expected | Actual |
|---|-----------|---------|----------|--------|
| D-01 | AssistantRevisionPanel.tsx:72 | "View Details & Resubmit" button | Navigate to task + resubmit flow | No onClick — DEAD BUTTON |
| D-02 | MangakaNotificationsTab.tsx | Notifications tab | Shows notification list | Empty stub (145 bytes) — renders nothing |
| D-03 | AssistantActivityPanel.tsx | Activity timeline | Activity feed | Stub (215 bytes) — empty |
| D-04 | MangakaDashboardOverview.tsx | Dashboard KPIs | Live stats from API | Stub (929 bytes) — static/empty |
| D-05 | BoardRightPanel.tsx | Right panel | Contextual board info | Stub (210 bytes) — empty |
| D-06 | EditorialBoardDashboard.tsx | Board dashboard | Board overview | Stub (169 bytes) — empty |
| D-07 | /tasks route | Tasks page | Full task management | Stub (135 bytes) |
| D-08 | /assistant route | Assistant root | Dashboard | Stub (173 bytes) |
| D-09 | /board route | Board root | Board dashboard | Stub (153 bytes) |
| D-10 | /series route | Series root | Series list | Stub (140 bytes) |

---

# PHASE 6: UI/UX AUDIT SUMMARY

## Critical UX Failures

| # | Location | Issue | Impact |
|---|---------|-------|--------|
| UX-01 | MangakaRankingsTab | Series shows as "Series XXXXXXXX" instead of real title | Mangaka cannot identify their series in ranking |
| UX-02 | MangakaSeriesTab | Status badges unstyled (number vs string key mismatch) | Cannot distinguish series by status visually |
| UX-03 | AssistantRevisionPanel | "View Details & Resubmit" is a dead button | Assistant has no path to resubmit after revision request |
| UX-04 | Notification UX | 30s polling delay vs real-time SignalR push | Notifications feel stale; critical events delayed |
| UX-05 | MangakaNotificationsTab | Empty stub — no notification UI in Mangaka dashboard | User has no way to see notifications inside their dashboard |
| UX-06 | ChapterDetailPage (/series/[id]/chapters/[id]) | Raw HTML with no styling | Completely unusable page for actual production |
| UX-07 | /series, /tasks, /board, /assistant routes | Stub routes with no content | Navigation dead-ends |

## Medium UX Issues

| # | Location | Issue |
|---|---------|-------|
| UX-08 | AssistantDashboard | useMockFallback hardcoded false — if API fails, empty table with no fallback |
| UX-09 | Editorial tab | Review link goes to /editorial root, not specific review ID |
| UX-10 | MangakaTasksTab | Assistant directory not preloaded — needs dropdown to load |
| UX-11 | Page editor | localStorage-based chapter ID selection is fragile (clears on tab/browser) |

---

# PHASE 7: TRACEABILITY MATRIX

| Req ID | Requirement | BE Endpoint | FE Component | Contract | Dead UI | Priority |
|--------|-------------|------------|-------------|---------|---------|----------|
| BR-FR-01 | Login | POST /identity/auth/login | LoginPage | ✅ | ❌ | High |
| BR-FR-02 | Role-based access | JWT roles | middleware.ts | ✅ | ❌ | High |
| BR-FR-06 | Create series | POST /manga/series | MangakaSeriesTab | ✅ | ❌ | High |
| BR-FR-07 | View series status | GET /manga/series | MangakaSeriesTab | 🔴 C-01 badge mismatch | D-08 | High |
| BR-FR-08 | Submit series proposal | POST .../submit-proposal | MangakaSeriesTab | ✅ | ❌ | High |
| BR-FR-09 | Approve/Reject series | POST .../approve-proposal | BoardVotingPanel | ✅ | ❌ | High |
| BR-FR-11 | Create chapter | POST .../chapters | MangakaChaptersTab | ✅ | ❌ | High |
| BR-FR-14 | Submit chapter for review | POST .../submit-review | MangakaChaptersTab | ✅ | ❌ | High |
| BR-FR-16 | Upload page | POST /files/upload + /manga/.../pages | MangakaPageEditorTab | ✅ | ❌ | High |
| BR-FR-18 | Preview page image | GET /files/{id}/url | MangakaPageEditorTab | ⚠️ fileId vs fileAssetId | ❌ | High |
| BR-FR-21 | Draw annotation | POST /manga/pages/{id}/annotations | MangakaPageEditorTab | ✅ | ❌ | High |
| BR-FR-26 | Create task | POST /manga/tasks | MangakaTasksTab | ✅ | ❌ | High |
| BR-FR-29 | View My Tasks | GET /manga/tasks/my | AssistantDashboard | ✅ | ❌ | High |
| BR-FR-31 | Submit task | POST /manga/tasks/{id}/submit | AssistantTaskDetailPreview | ⚠️ fileId field | ❌ | High |
| BR-FR-34 | Request revision | POST .../request-revision | MangakaTasksTab | ✅ | ❌ | High |
| BR-FR-34b | Resubmit after revision | POST .../submit | AssistantRevisionPanel | ✅ BE | D-01 DEAD BUTTON | High |
| BR-FR-37 | Review queue | GET /editorial/reviews | TantouEditorDashboard | ✅ | ❌ | High |
| BR-FR-39 | Add review comment | POST .../comments | editorial/page.tsx | ✅ | ❌ | High |
| BR-FR-40 | Approve/RevisionRequest | POST .../approve | editorial/page.tsx | ✅ | ❌ | High |
| BR-FR-42 | Board vote | POST .../votes | BoardVotingPanel | ✅ | ❌ | High |
| BR-FR-43 | Finalize proposal | POST .../finalize-proposal | BoardVotingPanel | ✅ | ❌ | Medium |
| BR-FR-44 | View ranking table | GET /editorial/issues/{id}/rankings | RankingTable | 🔴 C-02 title mismatch | ❌ | High |
| BR-FR-45 | Hiatus/Cancel series | POST .../hiatus, cancel | CancellationRiskPanel | ✅ | ❌ | High |
| BR-FR-46 | Input reader votes | POST .../reader-votes | ReaderVoteInputDialog | ✅ | ❌ | High |
| BR-FR-47 | Calculate ranking | POST .../calculate-ranking | IssueManagement | ✅ | ❌ | High |
| BR-FR-51 | Receive notification | GET /notifications/my + SignalR | useNotifications | ⚠️ polling only | ❌ | High |
| BR-FR-55 | View/mark read notifications | GET + POST /notifications | MangakaNotificationsTab | 🔴 D-02 STUB | D-02 | High |
| BR-FR-56 | User list (admin) | GET /identity/admin/users | UserManagement | ✅ | ❌ | Medium |
| BR-FR-57 | Update roles (admin) | PATCH .../roles | UserRoleDialog | ✅ | ❌ | Medium |
| BR-FR-58 | Service health | GET /admin/monitoring/overview | SystemHealth | ✅ | ❌ | Low |

---

# PHASE 8/9: PRIORITIZED IMPLEMENTATION PROPOSAL

## Priority 1 — CRITICAL (blocks user flow)

### FIX-01: Series status badge — numeric→string key mismatch
**File**: components/mangaka/MangakaSeriesTab.tsx:11-21
**Problem**: SERIES_STATUS_STYLE keyed by string ('Draft', 'Submitted', ...) but SeriesStatus is numeric (1,2,3...).
**Fix**: Add a numeric→string mapper or change keys to match numeric enum values.
**Effort**: XS (30 min)
**Evidence**: types/manga.ts:4 SeriesStatus = 1|2|3|...; MangakaSeriesTab.tsx:11-21 string keys.

### FIX-02: "View Details & Resubmit" button — dead button
**File**: components/assistant/AssistantRevisionPanel.tsx:71-76
**Problem**: Button has no onClick handler — assistant has no path to resubmit after revision request.
**Fix**: Add onClick → navigate to task detail with resubmit mode OR inline resubmit flow.
**Effort**: M (2-4 hrs)
**Evidence**: AssistantRevisionPanel.tsx:72 — button renders text but no handler.

### FIX-03: MangakaNotificationsTab — empty stub
**File**: components/mangaka/MangakaNotificationsTab.tsx
**Problem**: 145 bytes — renders nothing. Notification bell shows unread count but clicking the tab is empty.
**Fix**: Integrate useNotifications hook, render notification list with mark-as-read and delete.
**Effort**: S (2-3 hrs)
**Evidence**: useNotifications.ts is fully implemented; notificationApi.ts is complete.

### FIX-04: Ranking seriesTitle — always shows truncated ID
**File**: hooks/useMangakaRankings.ts:57
**Problem**: seriesTitle: 'Series ' + id.slice(0,8) — fabricated name because BE ranking snapshot doesn't include title.
**Fix Option A**: FE fetches series list separately and joins by seriesId to get real title.
**Fix Option B**: Request BE to add seriesTitle to RankingItemResponse.
**Effort**: S-M
**Evidence**: useMangakaRankings.ts:54-62; types/editorial.ts:58-68 (no seriesTitle field).

### FIX-05: Start editorial review — no FE integration
**File**: Missing button in TantouEditorDashboard or editorial/page.tsx
**Problem**: BE has POST /editorial/reviews/{id}/start but no FE button to trigger it. Editor likely sees 'Pending' reviews with no way to start them.
**Fix**: Add "Start Review" button in review list that calls editorialApi.startReview(id).
**Effort**: XS-S (1-2 hrs)
**Evidence**: NotificationsController — A-01 above; editorial-api.ts has startReview() defined.

---

## Priority 2 — HIGH (degrades core workflow)

### FIX-06: SignalR integration for notifications
**File**: hooks/useNotifications.ts
**Problem**: 30s polling creates up to 30s delay for time-critical notifications (task assigned, revision requested).
**Fix**: Replace setInterval polling with @microsoft/signalr connection to /hubs/notifications.
**Effort**: M (4-6 hrs)
**Evidence**: NotificationHub.cs exists; useNotifications.ts uses setInterval every 30000ms.

### FIX-07: /series route stub
**File**: app/series/page.tsx (140 bytes)
**Problem**: Navigating to /series shows a stub. Series management lives inside the dashboard tab.
**Fix**: Either redirect to /dashboard?tab=series or render a full series management page.
**Effort**: XS (30 min redirect, or S if building page)

### FIX-08: /tasks route stub
**File**: app/tasks/page.tsx (135 bytes)
**Problem**: Same as above — /tasks is a dead route.
**Fix**: Redirect to /dashboard?tab=tasks or render task management.
**Effort**: XS

### FIX-09: /assistant and /board route stubs
**Files**: app/assistant/page.tsx, app/board/page.tsx
**Problem**: Dead routes — navigation may land here.
**Fix**: Redirect to the actual dashboard component for each role.
**Effort**: XS each

### FIX-10: ChapterDetailPage — raw HTML
**File**: app/series/[seriesId]/chapters/[chapterId]/page.tsx
**Problem**: Functional but unstyled — pure browser-default HTML. Completely mismatches the rest of the dark-theme UI.
**Fix**: Replace with proper styled component using existing design system (Tailwind dark theme).
**Effort**: M (3-5 hrs)

---

## Priority 3 — MEDIUM (feature incomplete)

### FIX-11: File versioning UI
**File**: Missing component
**Problem**: GET /files/{id}/versions and POST /files/{id}/versions exist on BE but no FE UI for version history.
**Fix**: Add file version panel to MangakaFilesTab showing version history and new version upload.
**Effort**: M (4 hrs)

### FIX-12: Admin password reset
**File**: components/admin/UserDetailDialog.tsx
**Problem**: POST /identity/admin/users/{id}/reset-password defined in BE, not in admin-api.ts or UserDetailDialog.
**Fix**: Add resetPassword() to admin-api.ts; add "Reset Password" button in UserDetailDialog.
**Effort**: S (1-2 hrs)

### FIX-13: fileId vs fileAssetId in PageResponse
**File**: types/manga.ts:79-80
**Problem**: PageResponse declares both ileId and ileAssetId — ambiguous. MangakaPageEditorTab reads ileId. If BE returns ileAssetId, images never load.
**Fix**: Verify BE response field name. Remove duplicate declaration in types.
**Effort**: XS (15 min verification + fix)

### FIX-14: AssistantDashboardOverview — live KPIs
**File**: components/mangaka/MangakaDashboardOverview.tsx (929 bytes — stub)
**Problem**: Dashboard overview shows nothing — no live KPI data.
**Fix**: Compute stats from useMangakaDashboard (total series, pending tasks, upcoming deadlines) and render.
**Effort**: S (2-3 hrs)

### FIX-15: Admin revoke sessions
**File**: components/admin/UserDetailDialog.tsx
**Problem**: POST /identity/admin/users/{id}/revoke-sessions exists on BE but missing from FE.
**Fix**: Add to admin-api.ts + button in UserDetailDialog.
**Effort**: XS (30 min)

---

## Summary Table

| Fix | Category | Effort | Priority |
|-----|----------|--------|----------|
| FIX-01 Series badge mismatch | C — Contract mismatch | XS | P1 |
| FIX-02 Dead resubmit button | D — Dead UI | M | P1 |
| FIX-03 Notifications tab stub | D — Dead UI | S | P1 |
| FIX-04 Ranking seriesTitle | C — Contract mismatch | S-M | P1 |
| FIX-05 Start review missing | A — BE only | XS-S | P1 |
| FIX-06 SignalR real-time | Infra gap | M | P2 |
| FIX-07 /series stub | D — Dead UI | XS | P2 |
| FIX-08 /tasks stub | D — Dead UI | XS | P2 |
| FIX-09 /assistant /board stubs | D — Dead UI | XS | P2 |
| FIX-10 ChapterDetailPage styling | UX | M | P2 |
| FIX-11 File versioning | A — BE only | M | P3 |
| FIX-12 Admin reset password | A — BE only | S | P3 |
| FIX-13 fileId vs fileAssetId | C — Ambiguous | XS | P3 |
| FIX-14 Dashboard live KPIs | D — Dead UI | S | P3 |
| FIX-15 Admin revoke sessions | A — BE only | XS | P3 |
