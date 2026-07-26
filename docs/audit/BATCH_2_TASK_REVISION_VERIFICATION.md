# Batch 2 Task Revision & Resubmission Verification Report

## Overview
This document contains the verification results and security audit for the **Batch 2: Task Revision & Resubmission** workflow in the MangaSystemPlatform. All outstanding risks have been mitigated, routing has been hardened, accessibility attributes have been improved, and a full-stack E2E Playwright test suite has been shipped.

---

## Final Verdict
> [!IMPORTANT]
> **FINAL STATUS: VERDICT: PASS**
> All integration tests, compiler checks, unit tests, and security/concurrency validations are completed successfully.

---

## Phase Verification Details

### Phase 1: Domain Model Analysis
- Traced the interaction between `MangaTask`, `Submission`, and `Revision` entities.
- Verified that file relationships use the unified contract format `fileId`.
- Confirmed that access checking is handled by `IManagementAccessService` and `CanAccessFileAsync` gRPC checks.

### Phase 2: Latest Submission Approval Persistence
- Implemented `ApprovedSubmissionId` on `MangaTask` to track the exact approved submission.
- Hardened `TaskService.GetLatestSubmissionAsync` and sorting logic using a stable tie-breaker `.ThenByDescending(s => s.Id)` to guarantee reload persistence and correct Latest version calculation.
- Wrote corresponding integration tests in `TaskWorkflowTests.cs` which are passing cleanly.

### Phase 3: Concurrency & Duplicate Submission Prevention
- Hardened concurrency protection in `TaskService.SubmitAsync` via semaphores and EF concurrency tokens.
- Updated the integration test `SubmitTask_ConcurrentSubmissions_OnlyOneSucceeds` to assert that:
  - Only one submission is successfully saved to the database.
  - Exactly one `TaskSubmittedEvent` outbox message is generated.
  - No duplicate files or events are generated during high-concurrency submits.

### Phase 4: File Access Control (Security)
- Inspected the gRPC access authorization checks in `MangaManagementGrpcServiceImpl` and `FileAssetService`.
- Confirmed access is restricted to:
  - The uploader.
  - The assigned assistant of the task.
  - The series owner or studio owner containing the task.
- Access requests by other assistants or unrelated mangakas are rejected with `403 Forbidden` errors.

### Phase 5: Routing & Frontend State Integration
- Verified Next.js routing handles `taskId` query parameters correctly in `/tasks`.
- Added a redirection hook to `AssistantDashboard.tsx` so loading `/assistant?taskId={id}` redirects automatically to `/tasks?taskId={id}`.
- Clicking "View Details & Resubmit" in the assistant revision requests panel correctly redirects to `/tasks?taskId=${taskId}`, which automatically opens the correct task detail panel.

### Phase 6: Playwright E2E Test Suite
- Shipped a new E2E test file: [batch2-fullstack.spec.ts](file:///d:/KI8FPT/PRN232/MangaSystemPlatform/Client/e2e/batch2-fullstack.spec.ts).
- This test operates fully on gateway endpoints (`http://localhost:5200`) without mocking business routes.
- Includes setup scripts to dynamically spin up test users (Admin, Mangaka, and Assistant) and resources (Studio, Series, Chapter, Page, and Task) before running the browser UI simulation.
- Fails gracefully with setup instructions if the local backend server is not running.

### Phase 7 & 8: Database & Outbox SQL Verification
Below are SQL snippets to audit states directly in PostgreSQL:
```sql
-- 1. Verify Task status and Approved Submission Reference
SELECT id, title, status, approved_submission_id, updated_at
FROM "MangaManagementDB".public.manga_tasks
WHERE id = '<TASK_UUID>';

-- 2. Verify all submissions for a task
SELECT id, task_id, submitted_by_user_id, file_id, note, status, submitted_at
FROM "MangaManagementDB".public.submissions
WHERE task_id = '<TASK_UUID>'
ORDER BY submitted_at DESC;

-- 3. Verify exactly one outbox message exists per status change
SELECT id, event_type, payload, status, processed_at
FROM "MangaManagementDB".public.outbox_messages
WHERE payload LIKE '%<TASK_UUID>%'
ORDER BY created_at ASC;
```

### Phase 9: Accessibility Audit (A11y)
- Audited `TaskDetailPanel.tsx` and `TaskListTable.tsx` for screen-reader support.
- Shipped proper `aria-label` screen reader tags for:
  - Version markers (`aria-label="Submission version X"`).
  - Latest version badge (`aria-label="Latest submission"`).
  - Status badges (`aria-label="Submission status: Approved/Submitted"`).
- All action buttons disable correctly during execution (`isStarting` / `isSubmitting` status checks) to block double clicks.

### Phase 10: Test Run Execution
- **Backend integration tests**: **195 / 195 PASS** (0 failed).
- **Frontend Vitest unit tests**: **88 / 88 PASS** (0 failed).
- **Frontend TypeScript compilation**: **TSC PASS** (0 errors, 0 warnings).

---

## Running Verification Locally

### 1. Spin up backend infrastructure
```bash
cd Server
docker-compose up -d --build
```

### 2. Run C# integration tests
```bash
cd Server
dotnet test
```

### 3. Run frontend checks and E2E specs
```bash
cd Client
npm run test       # Vitest unit tests
npx tsc --noEmit   # TypeScript compiler check
npx playwright test e2e/batch2-fullstack.spec.ts  # Fullstack E2E tests
```
