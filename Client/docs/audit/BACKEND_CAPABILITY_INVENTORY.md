# BACKEND CAPABILITY INVENTORY
**MangaSystemPlatform — Audit Phase 2**
Generated: 2026-07-24

Gateway: http://localhost:5200 (port 5200:8080 Docker)
All routes below are relative to the Gateway.

---

## 1. Identity Service — /identity/**

### AuthController (No [Authorize])
| Route | Method | Role | Request DTO | Response DTO | Side Effects |
|-------|--------|------|-------------|-------------|-------------|
| /identity/auth/register | POST | Public | RegisterRequest | AuthResponse | Creates user, issues JWT |
| /identity/auth/login | POST | Public | LoginRequest | AuthResponse | Issues JWT + refresh token |
| /identity/auth/refresh | POST | Public | RefreshTokenRequest | AuthResponse | Rotates refresh token |
| /identity/auth/logout | POST | Public | RefreshTokenRequest | string | Revokes refresh token |

### UsersController
| Route | Method | Role | Request DTO | Response DTO |
|-------|--------|------|-------------|-------------|
| /identity/users/me | GET | Authenticated | — | {id, email, fullName, roles} |
| /identity/users/assistants | GET | Authenticated | — | AssistantDirectoryItem[] |

### AdminUsersController (Policy-based)
| Route | Method | Policy | Request/Response |
|-------|--------|--------|-----------------|
| /identity/admin/users | GET | RequireAdminUserRead | AdminUserListQuery → PagedResponse<AdminUserListItemResponse> |
| /identity/admin/users/{id} | GET | RequireAdminUserRead | — → AdminUserDetailResponse |
| /identity/admin/roles | GET | RequireAdminRoleRead | — → AdminRoleCatalogResponse[] |
| /identity/admin/users | POST | RequireAdminUserCreate | CreateAdminUserRequest → AdminUserResponse |
| /identity/admin/users/{id} | PATCH | RequireAdminUserUpdate | UpdateAdminUserRequest → AdminUserResponse |
| /identity/admin/users/{id} | DELETE | RequireAdminUserDelete | — → bool |
| /identity/admin/users/{id}/lock | POST | RequireAdminUserUpdate | LockUserRequest → AdminUserResponse |
| /identity/admin/users/{id}/unlock | POST | RequireAdminUserUpdate | — → AdminUserResponse |
| /identity/admin/users/{id}/reset-password | POST | RequireAdminUserResetPassword | ResetUserPasswordRequest → bool |
| /identity/admin/users/{id}/revoke-sessions | POST | RequireAdminUserSessionRevoke | — → bool |
| /identity/admin/users/{id}/status | PATCH | RequireAdminUserManage | UpdateUserStatusRequest → AdminUserResponse |
| /identity/admin/users/{id}/roles | PATCH | RequireAdminUserManage | UpdateUserRolesRequest → AdminUserResponse |

### AdminRolesController
| Route | Method | Policy | Notes |
|-------|--------|--------|-------|
| /identity/admin/roles | POST | RequireAdminRoleCreate | Create role |
| /identity/admin/roles/{id} | PATCH | RequireAdminRoleUpdate | Update role |
| /identity/admin/roles/{id} | DELETE | RequireAdminRoleDelete | Retire role |
| /identity/admin/roles/{id}/permissions | PUT | RequireAdminRoleUpdate | Replace permissions |

### AdminPermissionsController
| Route | Method | Policy |
|-------|--------|--------|
| /identity/admin/permissions | GET | RequireAdminRoleRead |

### AdminAuditLogsController
| Route | Method | Policy |
|-------|--------|--------|
| /identity/admin/audit-logs | GET | RequireAdminAuditRead |

---

## 2. Manga Management Service — /manga/**

### StudiosController
| Route | Method | Role | Request | Response |
|-------|--------|------|---------|---------|
| POST /manga/studios | POST | Mangaka,Admin | CreateStudioRequest | StudioResponse |
| GET /manga/studios/my | GET | Authenticated | — | StudioResponse[] |
| GET /manga/studios/{id} | GET | Authenticated | — | StudioResponse |
| POST /manga/studios/{id}/members | POST | Mangaka,Admin | AddStudioMemberRequest | StudioResponse |

### SeriesController
| Route | Method | Role | Request | Response | State Transition |
|-------|--------|------|---------|---------|-----------------|
| POST /manga/series | POST | Mangaka,Admin | CreateSeriesRequest | SeriesResponse | Draft |
| GET /manga/series | GET | Authenticated | — | SeriesResponse[] | — |
| GET /manga/series/{id} | GET | Authenticated | — | SeriesResponse | — |
| PATCH /manga/series/{id} | PATCH | Mangaka,Admin | UpdateSeriesRequest | SeriesResponse | — |
| POST /manga/series/{id}/submit-proposal | POST | Mangaka,Admin | — | SeriesResponse | Draft→Submitted |
| POST /manga/series/{id}/approve-proposal | POST | EditorialBoard,Admin | SeriesDecisionRequest | SeriesResponse | Submitted→Approved |
| POST /manga/series/{id}/reject-proposal | POST | EditorialBoard,Admin | SeriesDecisionRequest | SeriesResponse | Submitted→Rejected |
| POST /manga/series/{id}/chapters | POST | Mangaka,Admin | CreateChapterRequest | ChapterResponse | — |
| GET /manga/series/{id}/chapters | GET | Authenticated | — | ChapterResponse[] | — |

### ChaptersController
| Route | Method | Role | Request | Response | State |
|-------|--------|------|---------|---------|-------|
| GET /manga/chapters/{id} | GET | Authenticated | — | ChapterResponse | — |
| PATCH /manga/chapters/{id}/status | PATCH | Mangaka,Admin | UpdateChapterStatusRequest | ChapterResponse | Any→Any |
| POST /manga/chapters/{id}/submit-review | POST | Mangaka,Admin | — | SubmissionResponse | Draft→SubmittedForReview |
| POST /manga/chapters/{id}/pages | POST | Mangaka,Admin | CreatePageRequest | PageResponse | — |
| GET /manga/chapters/{id}/pages | GET | Authenticated | — | PageResponse[] | — |

### PagesController
| Route | Method | Role | Request | Response |
|-------|--------|------|---------|---------|
| GET /manga/pages/{id} | GET | Authenticated | — | PageResponse |
| PATCH /manga/pages/{id}/status | PATCH | Mangaka,Admin | UpdatePageStatusRequest | PageResponse |
| POST /manga/pages/{id}/annotations | POST | Mangaka,Admin | CreateAnnotationRequest | AnnotationResponse |
| GET /manga/pages/{id}/annotations | GET | Authenticated | — | AnnotationResponse[] |

### AnnotationsController
| Route | Method | Role | Request | Response |
|-------|--------|------|---------|---------|
| DELETE /manga/annotations/{id} | DELETE | Mangaka,Admin | — | success |

### TasksController
| Route | Method | Role | Request | Response | State |
|-------|--------|------|---------|---------|-------|
| POST /manga/tasks | POST | Mangaka,Admin | CreateTaskRequest | TaskResponse | Todo |
| GET /manga/tasks/my | GET | Authenticated | — | TaskResponse[] | — |
| GET /manga/tasks/{id} | GET | Authenticated | — | TaskResponse | — |
| POST /manga/tasks/{id}/start | POST | Assistant,Admin | — | TaskResponse | Todo→InProgress |
| POST /manga/tasks/{id}/submit | POST | Assistant,Admin | SubmitTaskRequest | TaskSubmissionResponse | InProgress→Submitted |
| POST /manga/tasks/{id}/approve | POST | Mangaka,Admin | — | TaskResponse | Submitted→Approved |
| POST /manga/tasks/{id}/request-revision | POST | Mangaka,Admin | RequestRevisionRequest | TaskResponse | Submitted→RevisionRequired |

### ReaderController (Out of scope for core workflow)
Endpoints: favorites, bookmarks, progress, continue-reading, history, ratings, comments
All in /manga/reader/** — these are reader portal features, NOT production workflow.

---

## 3. File Service — /files/**

| Route | Method | Role | Notes |
|-------|--------|------|-------|
| POST /files/upload | POST | Mangaka,Assistant,Admin | multipart/form-data; [FromForm] FileUploadFormRequest |
| GET /files/{id} | GET | Authenticated | File metadata |
| GET /files/{id}/download | GET | Authenticated | Binary stream |
| GET /files/{id}/url | GET | Authenticated | Pre-signed/direct URL |
| POST /files/{id}/versions | POST | Mangaka,Assistant,Admin | New version upload |
| GET /files/{id}/versions | GET | Authenticated | Version list |
| DELETE /files/{id} | DELETE | Mangaka,Admin | Soft delete |
| GET /files/my | GET | Authenticated | User's files |

---

## 4. Editorial Service — /editorial/**

### EditorialReviewsController
| Route | Method | Role | Request | Response | State |
|-------|--------|------|---------|---------|-------|
| POST /editorial/reviews | POST | Mangaka,TantouEditor,Admin | CreateEditorialReviewRequest | EditorialReviewResponse | Pending |
| GET /editorial/reviews | GET | Authenticated | — | EditorialReviewResponse[] | — |
| GET /editorial/reviews/{id} | GET | Authenticated | — | EditorialReviewResponse | — |
| POST /editorial/reviews/{id}/start | POST | TantouEditor,Admin | — | EditorialReviewResponse | Pending→InReview |
| POST /editorial/reviews/{id}/comments | POST | TantouEditor,Admin | CreateEditorialCommentRequest | EditorialCommentResponse | — |
| GET /editorial/reviews/{id}/comments | GET | Authenticated | — | EditorialCommentResponse[] | — |
| POST /editorial/reviews/{id}/approve | POST | TantouEditor,Admin | DecisionRequest | EditorialReviewResponse | InReview→Approved |
| POST /editorial/reviews/{id}/request-revision | POST | TantouEditor,Admin | DecisionRequest | EditorialReviewResponse | InReview→RevisionRequested |
| POST /editorial/reviews/{id}/reject | POST | TantouEditor,Admin | DecisionRequest | EditorialReviewResponse | InReview→Rejected |

### BoardVotesController (/editorial/series/{seriesId}/...)
| Route | Method | Role | Request | Response |
|-------|--------|------|---------|---------|
| POST .../votes | POST | EditorialBoard,Admin | BoardVoteRequest | BoardVoteSummary |
| GET .../votes | GET | Authenticated | — | Vote[] |
| GET .../vote-summary | GET | Authenticated | — | BoardVoteSummaryResponse |
| POST .../finalize-proposal | POST | EditorialBoard,Admin | FinalizeProposalRequest | BoardVoteSummaryResponse |
| POST .../hiatus | POST | EditorialBoard,Admin | — | PublicationStatus |
| POST .../cancel | POST | EditorialBoard,Admin | — | PublicationStatus |
| GET .../ranking-history | GET | Authenticated | — | RankingItemResponse[] |
| GET .../cancellation-warnings | GET | Authenticated | — | CancellationWarningResponse[] |

### IssuesController (/editorial/issues/...)
| Route | Method | Role | Request | Response |
|-------|--------|------|---------|---------|
| POST /editorial/issues | POST | EditorialBoard,Admin | CreateIssueRequest | IssueResponse |
| GET /editorial/issues | GET | Authenticated | — | IssueResponse[] |
| GET /editorial/issues/{id} | GET | Authenticated | — | IssueResponse |
| PATCH /editorial/issues/{id}/status | PATCH | EditorialBoard,Admin | UpdateIssueStatusRequest | IssueResponse |
| POST /editorial/issues/{id}/reader-votes | POST | EditorialBoard,Admin | ReaderVoteRequest | — |
| GET /editorial/issues/{id}/reader-votes | GET | Authenticated | — | ReaderVote[] |
| POST /editorial/issues/{id}/calculate-ranking | POST | EditorialBoard,Admin | — | RankingSnapshotResponse |
| GET /editorial/issues/{id}/rankings | GET | Authenticated | — | RankingSnapshotResponse[] |
| GET /editorial/issues/cancellation-warnings | GET | Authenticated | — | CancellationWarningResponse[] |

### PublicationSchedulesController
| Route | Method | Role | Request | Response |
|-------|--------|------|---------|---------|
| POST /editorial/publication-schedules | POST | EditorialBoard,Admin | CreatePublicationScheduleRequest | PublicationScheduleResponse |
| GET /editorial/publication-schedules | GET | Authenticated | — | PublicationScheduleResponse[] |
| GET /editorial/publication-schedules/{id} | GET | Authenticated | — | PublicationScheduleResponse |
| POST /editorial/publication-schedules/{id}/publish | POST | EditorialBoard,Admin | — | PublicationScheduleResponse |

---

## 5. Notification Service — /notifications/**

| Route | Method | Role | Response |
|-------|--------|------|---------|
| GET /notifications/my | GET | Authenticated | NotificationResponse[] |
| GET /notifications/unread-count | GET | Authenticated | UnreadCountResponse |
| POST /notifications/{id}/read | POST | Authenticated | NotificationResponse |
| POST /notifications/read-all | POST | Authenticated | UnreadCountResponse |
| DELETE /notifications/{id} | DELETE | Authenticated | success |

SignalR Hub: /hubs/notifications (Authenticated)

---

## 6. Gateway — /health/**

| Route | Notes |
|-------|-------|
| GET /health/live | Liveness probe |
| GET /health/ready | Readiness probe |
| GET /health/services | Service summary |
| GET /admin/monitoring/overview | Detailed monitoring (Admin) |

---

## 7. MISSING Backend Endpoints (Required by BRD)

| Missing | Description | Priority |
|---------|-------------|----------|
| GET /manga/tasks/{chapterId}/by-chapter | List all tasks for a chapter (Mangaka view) | P1 |
| GET /manga/series/{id}/proposals | Dedicated endpoint for Pending series (Board queue) | P2 |
| GET /editorial/reviews/by-chapter/{chapterId} | Get review for specific chapter | P1 |
| PATCH /manga/chapters/{id}/progress | Update chapter progress percentage | P2 |
| GET /identity/users/{id}/profile | Get user profile by ID (for display names in tasks) | P1 |
| GET /manga/tasks/{id}/submissions | List all submissions for a task separately | P2 |

---

## 8. SignalR Hub

- Service: notification-service
- Hub: /hubs/notifications (file: NotificationHub.cs)
- FE Consumer: useNotifications.ts uses **polling** (setInterval 30s) — NOT SignalR
- **GAP: SignalR hub exists on BE but FE is NOT connected to it — uses HTTP polling instead**

---

## 9. RabbitMQ Events (Consumers detected)

| Event | Producer | Consumer |
|-------|----------|---------|
| ChapterSubmittedForReviewEvent | manga-service | editorial-service (creates review) |
| TaskAssignedEvent | manga-service | notification-service |
| TaskSubmittedEvent | manga-service | notification-service |
| TaskApprovedEvent | manga-service | notification-service |
| TaskRevisionRequestedEvent | manga-service | notification-service |
| ChapterApprovedEvent | editorial-service | manga-service (updates status) |
| ChapterRevisionRequestedEvent | editorial-service | manga-service (updates status) |
| RankingUpdatedEvent | editorial-service | notification-service |
