# FRONTEND CAPABILITY INVENTORY
**MangaSystemPlatform — Audit Phase 3**
Generated: 2026-07-24

FE Base URL: http://localhost:3000 → Gateway: http://localhost:5200

---

## 1. App Routes & Middleware

| Route | File | Allowed Roles | Component | Notes |
|-------|------|--------------|-----------|-------|
| / | app/page.tsx | Public | Landing page | Full animated landing page |
| /login | app/(auth)/... | Public | LoginPage | Redirects to /dashboard if already authed |
| /register | app/(auth)/... | Public | RegisterPage | — |
| /dashboard | app/dashboard/... | All roles | Role router | Redirects based on role |
| /series | app/series/page.tsx | mangaka, admin | Series list | Basic redirect page (STUB) |
| /series/[seriesId] | app/series/[seriesId]/page.tsx | mangaka, admin | SeriesDetail | 3028 bytes — minimal |
| /series/[seriesId]/chapters/[chapterId] | ...page.tsx | mangaka, admin | ChapterDetailPage | Annotation editor |
| /tasks | app/tasks/page.tsx | mangaka, assistant, admin | Task page | STUB (135 bytes) |
| /assistant | app/assistant/page.tsx | assistant, admin | Assistant dashboard | STUB (173 bytes) |
| /editorial | app/editorial/page.tsx | tantoueditor, editorialboard, admin | Editorial page | 41179 bytes |
| /board | app/board/page.tsx | editorialboard, admin | Board page | STUB (153 bytes) |
| /admin | app/admin/page.tsx | admin | Admin dashboard | Redirect |
| /admin/users | app/admin/users/page.tsx | admin | UserManagement | Full page |
| /admin/logs | app/admin/logs/... | admin | LogViewer | — |
| /admin/manga | app/admin/manga/... | admin | Series/Chapter Management | — |
| /admin/system | app/admin/system/... | admin | SystemHealth | — |
| /files | app/files/... | mangaka, assistant, admin | File manager | — |
| /reader | app/reader/... | all roles | Reader | — |
| /forbidden | app/forbidden/... | All | 403 page | — |

### Key Finding: Middleware Role Check
middleware.ts checks cookies 'user_roles' (JSON array) — roles are lowercase-normalized.
- FE sends lowercase roles. BE sends PascalCase roles in JWT (e.g. 'TantouEditor').
- 
ormalize() converts to lowercase. 'TantouEditor' → 'tantoueditor'. Middleware expects 'tantoueditor'. ✅ MATCHES.
- RISK: If backend sends 'tantoueditor' lowercase already in JWT, normalize still works. ✅

---

## 2. API Services vs Endpoints

### auth-api.ts
| FE Function | HTTP | Route | Notes |
|-------------|------|-------|-------|
| login() | POST | /identity/auth/login | ✅ matches BE |
| register() | POST | /identity/auth/register | ✅ matches BE |
| refresh() | POST | /identity/auth/refresh | ✅ matches BE |
| logout() | POST | /identity/auth/logout | ✅ matches BE |
| getMe() | GET | /identity/users/me | ✅ matches BE |
| getAssistants() | GET | /identity/users/assistants | ✅ matches BE |

### manga-api.ts
| FE Function | HTTP | Route | Notes |
|-------------|------|-------|-------|
| getMyStudios() | GET | /manga/studios/my | ✅ matches BE |
| createStudio() | POST | /manga/studios | ✅ matches BE |
| getSeries() | GET | /manga/series | ✅ matches BE |
| getSeriesById() | GET | /manga/series/{id} | ✅ matches BE |
| createSeries() | POST | /manga/series | ✅ matches BE |
| updateSeries() | PATCH | /manga/series/{id} | ✅ matches BE |
| submitProposal() | POST | /manga/series/{id}/submit-proposal | ✅ matches BE |
| approveProposal() | POST | /manga/series/{id}/approve-proposal | ✅ matches BE |
| rejectProposal() | POST | /manga/series/{id}/reject-proposal | ✅ matches BE |
| createChapter() | POST | /manga/series/{id}/chapters | ✅ matches BE |
| getChapters() | GET | /manga/series/{id}/chapters | ✅ matches BE |
| getChapterById() | GET | /manga/chapters/{id} | ✅ matches BE |
| submitChapterForReview() | POST | /manga/chapters/{id}/submit-review | ✅ matches BE |
| createPage() | POST | /manga/chapters/{id}/pages | ✅ matches BE |
| getPages() | GET | /manga/chapters/{id}/pages | ✅ matches BE |
| getPage() | GET | /manga/pages/{id} | ✅ matches BE |
| createAnnotation() | POST | /manga/pages/{id}/annotations | ✅ matches BE |
| deleteAnnotation() | DELETE | /manga/annotations/{id} | ✅ matches BE |
| getPageAnnotations() | GET | /manga/pages/{id}/annotations | ✅ matches BE |
| createTask() | POST | /manga/tasks | ✅ matches BE |
| getMyTasks() | GET | /manga/tasks/my | ✅ matches BE |
| getTaskById() | GET | /manga/tasks/{id} | ✅ matches BE |
| startTask() | POST | /manga/tasks/{id}/start | ✅ matches BE |
| submitTask() | POST | /manga/tasks/{id}/submit | ✅ matches BE |
| approveTask() | POST | /manga/tasks/{id}/approve | ✅ matches BE |
| requestTaskRevision() | POST | /manga/tasks/{id}/request-revision | ✅ matches BE |

### editorial-api.ts
| FE Function | HTTP | Route | Notes |
|-------------|------|-------|-------|
| getReviews() | GET | /editorial/reviews | ✅ |
| getReview() | GET | /editorial/reviews/{id} | ✅ |
| startReview() | POST | /editorial/reviews/{id}/start | ✅ |
| getReviewComments() | GET | /editorial/reviews/{id}/comments | ✅ |
| addReviewComment() | POST | /editorial/reviews/{id}/comments | ✅ |
| approveReview() | POST | /editorial/reviews/{id}/approve | ✅ |
| requestReviewRevision() | POST | /editorial/reviews/{id}/request-revision | ✅ |
| rejectReview() | POST | /editorial/reviews/{id}/reject | ✅ |
| voteProposal() | POST | /editorial/series/{id}/votes | ✅ |
| getVoteSummary() | GET | /editorial/series/{id}/vote-summary | ✅ |
| finalizeProposal() | POST | /editorial/series/{id}/finalize-proposal | ✅ |
| getPublicationSchedules() | GET | /editorial/publication-schedules | ✅ |
| createPublicationSchedule() | POST | /editorial/publication-schedules | ✅ |
| publishPublicationSchedule() | POST | /editorial/publication-schedules/{id}/publish | ✅ |
| createIssue() | POST | /editorial/issues | ✅ |
| getIssues() | GET | /editorial/issues | ✅ |
| updateIssueStatus() | PATCH | /editorial/issues/{id}/status | ✅ |
| inputReaderVote() | POST | /editorial/issues/{id}/reader-votes | ✅ |
| calculateRanking() | POST | /editorial/issues/{id}/calculate-ranking | ✅ |
| getRankings() | GET | /editorial/issues/{id}/rankings | ✅ |
| getSeriesRankingHistory() | GET | /editorial/series/{id}/ranking-history | ✅ |
| getCancellationWarnings() | GET | /editorial/series/{id}/cancellation-warnings | ✅ |
| getAllCancellationWarnings() | GET | /editorial/issues/cancellation-warnings | ✅ |
| setSeriesHiatus() | POST | /editorial/series/{id}/hiatus | ✅ |
| cancelSeries() | POST | /editorial/series/{id}/cancel | ✅ |

### notification-api.ts
| FE Function | HTTP | Route | Notes |
|-------------|------|-------|-------|
| getMyNotifications() | GET | /notifications/my | ✅ |
| getUnreadCount() | GET | /notifications/unread-count | ✅ |
| markAsRead() | POST | /notifications/{id}/read | ✅ |
| markAllAsRead() | POST | /notifications/read-all | ✅ |
| deleteNotification() | DELETE | /notifications/{id} | ✅ |

### file-api.ts
| FE Function | HTTP | Route | Notes |
|-------------|------|-------|-------|
| uploadFile() | POST | /files/upload | ✅ multipart/form-data |
| getMyFiles() | GET | /files/my | ✅ |
| getFileMetadata() | GET | /files/{id} | ✅ |
| getFileUrl() | GET | /files/{id}/url | ✅ |
| downloadFile() | GET | /files/{id}/download | ✅ blob |
| getFileVersions() | GET | /files/{id}/versions | ✅ |
| createVersion() | POST | /files/{id}/versions | ✅ |
| deleteFile() | DELETE | /files/{id} | ✅ |

---

## 3. Component Inventory

### Mangaka Role
| Component | File | Live API | Mock | Notes |
|-----------|------|---------|------|-------|
| MangakaSeriesTab | components/mangaka/MangakaSeriesTab.tsx | ✅ | ❌ | Studio + Series CRUD |
| MangakaChaptersTab | components/mangaka/MangakaChaptersTab.tsx | ✅ | ❌ | Chapter CRUD + submit review |
| MangakaPageEditorTab | components/mangaka/MangakaPageEditorTab.tsx | ✅ | ❌ | Page + Annotation editor |
| MangakaPageEditorEnhancedTab | components/mangaka/MangakaPageEditorEnhancedTab.tsx | ✅ | ❌ | Enhanced editor |
| MangakaTasksTab | components/mangaka/MangakaTasksTab.tsx | ✅ | ❌ | Task create + manage |
| MangakaEditorialTab | components/mangaka/MangakaEditorialTab.tsx | ✅ | ❌ | Editorial feedback view |
| MangakaRankingsTab | components/mangaka/MangakaRankingsTab.tsx | ✅ | ❌ | Ranking view |
| MangakaFilesTab | components/mangaka/MangakaFilesTab.tsx | ✅ | ❌ | File management |
| MangakaNotificationsTab | components/mangaka/MangakaNotificationsTab.tsx | ❌ | ❌ | STUB (145 bytes — EMPTY) |
| MangakaSettingsTab | components/mangaka/MangakaSettingsTab.tsx | ❌ | ❌ | Static — no API |
| MangakaDashboardOverview | components/mangaka/MangakaDashboardOverview.tsx | ❌ | ❌ | STUB (929 bytes) |

### Assistant Role
| Component | File | Live API | Mock | Notes |
|-----------|------|---------|------|-------|
| AssistantDashboard | components/assistant/AssistantDashboard.tsx | ✅ | useMockFallback=false | |
| AssistantTaskTable | components/assistant/AssistantTaskTable.tsx | ✅ | ❌ | Task list from API |
| AssistantTaskDetailPreview | components/assistant/AssistantTaskDetailPreview.tsx | ✅ | ❌ | File load + upload |
| AssistantRevisionPanel | components/assistant/AssistantRevisionPanel.tsx | ✅ | ❌ | From getMyTasks filtered |
| AssistantProgressPanel | components/assistant/AssistantProgressPanel.tsx | ✅ | ❌ | useAssistantProgress |
| AssistantActivityPanel | components/assistant/AssistantActivityPanel.tsx | ❌ | ❌ | STUB (215 bytes) |
| AssistantRightPanel | components/assistant/AssistantRightPanel.tsx | ❌ | ❌ | STUB (220 bytes) |
| AssistantStatCards | components/assistant/AssistantStatCards.tsx | ✅ partial | ❌ | Hard-coded secondary stats |

### Editorial (TantouEditor) Role
| Component | File | Live API | Mock | Notes |
|-----------|------|---------|------|-------|
| TantouEditorDashboard | components/editorial/TantouEditorDashboard.tsx | ✅ | ❌ | Review queue loaded |
| Editorial page | app/editorial/page.tsx | ✅ | ❌ | Full editorial workflow (41KB) |

### Board Role
| Component | File | Live API | Mock | Notes |
|-----------|------|---------|------|-------|
| BoardDashboard | components/board/BoardDashboard.tsx | ✅ | ❌ | useBoardDashboard |
| BoardVotingPanel | components/board/BoardVotingPanel.tsx | ✅ | ❌ | Vote + finalize |
| RankingTable | components/board/RankingTable.tsx | ✅ | ❌ | Rankings from API |
| IssueManagement | components/board/IssueManagement.tsx | ✅ | ❌ | CRUD + reader votes |
| CancellationRiskPanel | components/board/CancellationRiskPanel.tsx | ✅ | ❌ | Warnings from API |
| ReaderVoteInputDialog | components/board/ReaderVoteInputDialog.tsx | ✅ | ❌ | Input dialog |
| ProposalQueue | components/board/ProposalQueue.tsx | ✅ partial | ❌ | STUB (1035 bytes) |
| BoardRightPanel | components/board/BoardRightPanel.tsx | ❌ | ❌ | STUB (210 bytes) |
| EditorialBoardDashboard | components/board/EditorialBoardDashboard.tsx | ❌ | ❌ | STUB (169 bytes) |

### Admin Role
| Component | File | Live API | Mock | Notes |
|-----------|------|---------|------|-------|
| UserManagement | components/admin/UserManagement.tsx | ✅ | ❌ | Full user CRUD |
| UserDetailDialog | components/admin/UserDetailDialog.tsx | ✅ | ❌ | User detail + roles |
| UserRoleDialog | components/admin/UserRoleDialog.tsx | ✅ | ❌ | Role update |
| SystemHealth | components/admin/SystemHealth.tsx | ✅ | ❌ | Health overview |
| LogViewerTab | components/admin/LogViewerTab.tsx | ✅ partial | ❌ | Audit logs |
| SeriesManagement | components/admin/SeriesManagement.tsx | ✅ | ❌ | Admin series CRUD |
| ChapterManagement | components/admin/ChapterManagement.tsx | ✅ | ❌ | Admin chapter mgmt |
| AdminOverview | components/admin/AdminOverview.tsx | ✅ | ❌ | Admin dashboard |

---

## 4. Hooks Inventory

| Hook | File | API Used | Notes |
|------|------|---------|-------|
| useAssistantDashboard | hooks/useAssistantDashboard.ts | mangaApi.getMyTasks, startTask, submitTask | useMockFallback=false constant |
| useAssistantProgress | hooks/useAssistantProgress.ts | mangaApi.getMyTasks | Derived stats |
| useAssistantRevisions | hooks/useAssistantRevisions.ts | mangaApi.getMyTasks | Filters RevisionRequired |
| useBoardDashboard | hooks/useBoardDashboard.ts | mangaApi.getSeries, editorialApi.* | Full board workflow |
| useFiles | hooks/useFiles.ts | fileApi.* | File management |
| useMangakaDashboard | hooks/useMangakaDashboard.ts | mangaApi.getSeries | Dashboard stats |
| useMangakaEditorial | hooks/useMangakaEditorial.ts | editorialApi.getReviews | Editorial feedback |
| useMangakaRankings | hooks/useMangakaRankings.ts | editorialApi.getIssues, getRankings | Rankings |
| useNotifications | hooks/useNotifications.ts | notificationApi.* | 30s polling — NO SignalR |
| usePageAnnotations | hooks/usePageAnnotations.ts | mangaApi.getPageAnnotations, createAnnotation | — |
| useReader | hooks/useReader.ts | readerApi.* | Reader portal features |
| useSeries | hooks/useSeries.ts | mangaApi.getSeries | Series list |
| useTasks | hooks/useTasks.ts | mangaApi.getMyTasks, approve, requestRevision | Task actions |

---

## 5. SignalR Client Status

- SignalR hub exists at /hubs/notifications in notification-service
- **FE does NOT use SignalR** — uses HTTP polling every 30 seconds
- No @microsoft/signalr package usage found in hooks or components
- Impact: Notification delay up to 30 seconds; real-time UX degraded

---

## 6. Known Stubs / Empty Components

| Component | File | Status |
|-----------|------|--------|
| MangakaNotificationsTab | components/mangaka/MangakaNotificationsTab.tsx | STUB — 145 bytes, renders nothing useful |
| MangakaDashboardOverview | components/mangaka/MangakaDashboardOverview.tsx | STUB — 929 bytes, static placeholders |
| AssistantActivityPanel | components/assistant/AssistantActivityPanel.tsx | STUB — 215 bytes |
| AssistantRightPanel | components/assistant/AssistantRightPanel.tsx | STUB — 220 bytes |
| BoardRightPanel | components/board/BoardRightPanel.tsx | STUB — 210 bytes |
| EditorialBoardDashboard | components/board/EditorialBoardDashboard.tsx | STUB — 169 bytes |
| ProposalQueue | components/board/ProposalQueue.tsx | PARTIAL — 1035 bytes, limited UI |
| /tasks route | app/tasks/page.tsx | STUB — 135 bytes |
| /assistant route | app/assistant/page.tsx | STUB — 173 bytes |
| /board route | app/board/page.tsx | STUB — 153 bytes |
| /series route | app/series/page.tsx | STUB — 140 bytes |
