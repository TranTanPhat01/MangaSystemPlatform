# REQUIREMENTS CATALOG
**MangaSystemPlatform — Audit Phase 1**
Generated: 2026-07-24

---

## 1. Authentication & User Management

| Req ID | Actor | Pre | Main Flow | Error Flow | Expected UI | Expected API | Priority | MVP |
|--------|-------|-----|-----------|------------|-------------|-------------|----------|-----|
| BR-FR-01 | All | None | Login email+password | Invalid → error | Login form | POST /identity/auth/login | High | Yes |
| BR-FR-02 | All | Logged | Role-based access | Unauthorized → /forbidden | Gated nav | JWT role claim | High | Yes |
| BR-FR-03 | All | Logged | Sidebar per role | N/A | Role-specific sidebar | roles from JWT | High | Yes |
| BR-FR-04 | All | Logged | Logout → invalidate | Token invalid → login | Logout button | POST /identity/auth/logout | High | Yes |
| BR-FR-05 | Admin | Admin | User+role management | Not found → 404 | Admin user page | /identity/admin/users | Medium | Yes |

## 2. Studio Management

| Req ID | Actor | Pre | Main Flow | Expected API |
|--------|-------|-----|-----------|-------------|
| STU-01 | Mangaka | Logged | Create studio | POST /manga/studios |
| STU-02 | Mangaka | Studio | View own studios | GET /manga/studios/my |
| STU-03 | Mangaka | Studio | Add assistant member | POST /manga/studios/{id}/members |

## 3. Series Management

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-06 | Mangaka | Studio | Create series | POST /manga/series | High | Yes |
| BR-FR-07 | Mangaka | Series | View status/title | GET /manga/series | High | Yes |
| BR-FR-08 | Mangaka | Draft | Submit proposal | POST /manga/series/{id}/submit-proposal | High | Yes |
| BR-FR-09 | Board | Submitted | Approve/reject | POST /manga/series/{id}/approve-proposal | High | Yes |
| BR-FR-10 | Board | Approved | Set pub type | POST /editorial/series/{id}/finalize-proposal | Medium | Yes |

## 4. Chapter Management

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-11 | Mangaka | Series | Create chapter | POST /manga/series/{id}/chapters | High | Yes |
| BR-FR-12 | Mangaka | Chapter | View deadline/progress | GET /manga/chapters/{id} | High | Yes |
| BR-FR-13 | Mangaka | Chapter | View pages | GET /manga/chapters/{id}/pages | High | Yes |
| BR-FR-14 | Mangaka | Pages done | Submit for review | POST /manga/chapters/{id}/submit-review | High | Yes |
| BR-FR-15 | System | Review done | Update chapter status | Async event | High | Yes |

## 5. Page & Manuscript Management

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-16 | Mangaka | Chapter | Upload page | POST /files/upload + /manga/chapters/{id}/pages | High | Yes |
| BR-FR-17 | All | Page | View metadata | GET /manga/pages/{id} | High | Yes |
| BR-FR-18 | All | Page+file | Preview image | GET /files/{id}/url | High | Yes |
| BR-FR-19 | Mangaka | Upload | Validate file type | File service validation | Medium | Yes |
| BR-FR-20 | System | Upload | Files in MinIO | File service + MinIO | High | Yes |

## 6. Annotation Management

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-21 | Mangaka | Page | Draw rect → save annotation | POST /manga/pages/{id}/annotations | High | Yes |
| BR-FR-22 | Mangaka | Annotation | View coords/type/desc | GET /manga/pages/{id}/annotations | High | Yes |
| BR-FR-23 | Mangaka | Annotation | Link to task | POST /manga/tasks with annotationId | High | Yes |
| BR-FR-24 | Editor | Review | Add annotation in review | POST /editorial/reviews/{id}/comments with annotationId | Medium | Partial |
| BR-FR-25 | Mangaka | Editor | Zoom/pan canvas | client-side | Medium | Yes |

## 7. Task Management

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-26 | Mangaka | Annotation | Create task | POST /manga/tasks | High | Yes |
| BR-FR-27 | Mangaka | Task | Assign assistant | POST /manga/tasks (assignedToUserId) | High | Yes |
| BR-FR-28 | Mangaka | Task | View detail | GET /manga/tasks/{id} | High | Yes |
| BR-FR-29 | Assistant | Assigned | View My Tasks | GET /manga/tasks/my | High | Yes |
| BR-FR-30 | Assistant | Task | Status transitions | POST start/submit/approve/request-revision | High | Yes |

## 8. Submission Management

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-31 | Assistant | InProgress | Upload + submit | POST /files/upload + /manga/tasks/{id}/submit | High | Yes |
| BR-FR-32 | System | Submit | Save with file+note+timestamp | Task response | High | Yes |
| BR-FR-33 | Mangaka | Submitted | Approve | POST /manga/tasks/{id}/approve | High | Yes |
| BR-FR-34 | Mangaka | Submitted | Request revision | POST /manga/tasks/{id}/request-revision | High | Yes |
| BR-FR-35 | All | Multiple | View submission history | GET task detail .submissionHistory | Medium | Yes |

## 9. Editorial Review

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-36 | System | Chapter submitted | Auto-create review | RabbitMQ event | High | Yes |
| BR-FR-37 | Editor | Logged | Review queue | GET /editorial/reviews | High | Yes |
| BR-FR-38 | Editor | Review | Open detail | GET /editorial/reviews/{id} | High | Yes |
| BR-FR-39 | Editor | InReview | Add comment | POST /editorial/reviews/{id}/comments | High | Yes |
| BR-FR-40 | Editor | InReview | Approve/RevisionRequest | POST /editorial/reviews/{id}/approve, request-revision | High | Yes |

## 10. Editorial Board & Publication

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-41 | Board | Submitted | View proposals | GET /manga/series | High | Yes |
| BR-FR-42 | Board | Pending | Vote | POST /editorial/series/{id}/votes | High | Yes |
| BR-FR-43 | Board | Quorum | Finalize | POST /editorial/series/{id}/finalize-proposal | Medium | Yes |
| BR-FR-44 | Board | Issues | View ranking | GET /editorial/issues/{id}/rankings | High | Yes |
| BR-FR-45 | Board | Active | Hiatus/Cancel | POST /editorial/series/{id}/hiatus, cancel | High | Yes |

## 11. Reader Voting & Ranking

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-46 | Board | Issue | Input votes | POST /editorial/issues/{id}/reader-votes | High | Yes |
| BR-FR-47 | System | Votes | Calculate ranking | POST /editorial/issues/{id}/calculate-ranking | High | Yes |
| BR-FR-48 | System | Ranking | Store history | GET /editorial/series/{id}/ranking-history | High | Yes |
| BR-FR-49 | System | Low rank | Warning badge | GET /editorial/issues/cancellation-warnings | Medium | Yes |
| BR-FR-50 | Mangaka/Editor | Series | View ranking | GET /editorial/issues/{id}/rankings | Medium | Yes |

## 12. Notifications

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-51 | Assistant | Task assigned | Receive notification | GET /notifications/my + SignalR | High | Yes |
| BR-FR-52 | Mangaka | Submission done | Receive notification | GET /notifications/my | High | Yes |
| BR-FR-53 | Mangaka | Review decision | Receive notification | GET /notifications/my | High | Yes |
| BR-FR-54 | All | Ranking updated | Receive notification | GET /notifications/my | Medium | Yes |
| BR-FR-55 | All | Logged | View + mark read | GET /notifications/my + POST read | High | Yes |

## 13. Admin & Monitoring

| Req ID | Actor | Pre | Main Flow | Expected API | Priority | MVP |
|--------|-------|-----|-----------|-------------|----------|-----|
| BR-FR-56 | Admin | Admin | List users | GET /identity/admin/users | Medium | Yes |
| BR-FR-57 | Admin | Admin | Update roles | PATCH /identity/admin/users/{id}/roles | Medium | Yes |
| BR-FR-58 | Admin | Admin | Service health | GET /admin/monitoring/overview | Low | Yes |
| BR-FR-59 | Admin | Admin | Audit logs | GET /identity/admin/audit-logs | Low | Yes |
| BR-FR-60 | Admin | Admin | Lock/unlock user | POST /identity/admin/users/{id}/lock, unlock | Medium | Yes |

## 14. Business Rules Summary

| Rule | Description | Status |
|------|-------------|--------|
| BR-01 | Auth required for all protected routes | IMPLEMENTED |
| BR-02 | Role-based operations enforced | IMPLEMENTED |
| BR-03 | Only series owner/member can create chapter | PARTIAL (no BE ownership check in ChaptersController) |
| BR-04 | Task must belong to annotation | IMPLEMENTED |
| BR-05 | Assistant only sees own tasks | IMPLEMENTED |
| BR-06 | Task needs submission to become Submitted | IMPLEMENTED |
| BR-07 | Only Mangaka/Admin approves submission | IMPLEMENTED |
| BR-08 | Chapter minimum conditions before submit-review | MISSING (no completion validation) |
| BR-09 | Auto-create review when chapter submitted | IMPLEMENTED (RabbitMQ) |
| BR-10 | Editor approve/revision | IMPLEMENTED |
| BR-11 | Chapter status sync after review approval | IMPLEMENTED (async event) |
| BR-12 | Board decides publication type | IMPLEMENTED |
| BR-13 | Voting saved per issue | IMPLEMENTED |
| BR-14 | Ranking calc after voting | IMPLEMENTED |
| BR-15 | Low-rank series flagged | IMPLEMENTED |
| BR-16 | File upload returns fileId | IMPLEMENTED |
| BR-17 | Binary files not in DB | IMPLEMENTED (MinIO) |
| BR-18 | Audit trail for decisions | PARTIAL (BE has audit log, FE doesn't show audit trail) |
| BR-19 | Notifications for events | IMPLEMENTED (polling, not realtime push to FE) |
| BR-20 | No duplicate event processing | IMPLEMENTED (Outbox pattern) |
