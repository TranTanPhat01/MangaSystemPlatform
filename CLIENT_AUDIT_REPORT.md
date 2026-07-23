# Client Folder Comprehensive Audit Report
**Date:** 2026-07-23  
**Scope:** Entire Client folder - TypeScript compilation, API integration, hooks, components, services, types, store  
**Total Issues Found:** 20 (3 Critical, 5 High, 8 Medium, 4 Low)

---

## CRITICAL ISSUES (Blocks Compilation/Functionality)

### 1. useNotifications.ts - Multiple Type Mismatches
**File:** [Client/hooks/useNotifications.ts](Client/hooks/useNotifications.ts#L36-L41)  
**Lines:** 36-41  
**Error Type:** TypeScript Compilation Error  
**Current Code:**
```typescript
message: n.message || n.description || '',
isRead: n.isRead || false,
createdAt: n.createdAt,
actionUrl: n.actionUrl,
```

**Issue Description:**  
The code attempts to map `NotificationResponse` to `NotificationData`, but the properties don't exist:
- `description` → doesn't exist (NotificationResponse has `message`)
- `isRead` → doesn't exist (NotificationResponse has `status: NotificationStatus` enum)
- `actionUrl` → doesn't exist (NotificationResponse has no action URL field)

**Severity:** Critical  
**Impact:** TypeScript compilation fails. Feature completely broken.  
**Fix:** Map only existing fields and adjust NotificationData interface or API response structure.

---

### 2. useAssistantRevisions.ts - Array to String Type Mismatch
**File:** [Client/hooks/useAssistantRevisions.ts](Client/hooks/useAssistantRevisions.ts#L30)  
**Line:** 30  
**Error Type:** TypeScript Compilation Error  
**Current Code:**
```typescript
const mapped: RevisionRequest[] = revisionTasks.map((task: TaskResponse) => ({
  taskId: task.id,
  pageNumber: task.pageNumber,
  chapterInfo: `Chapter ${task.pageNumber}`,
  reason: task.revisions || 'Revisions requested',  // ← BUG: task.revisions is TaskRevisionResponse[]
  requestedDate: task.updatedAt
    ? new Date(task.updatedAt).toLocaleDateString()
    : 'Recently',
}));
```

**Issue Description:**  
- `RevisionRequest` interface expects `reason: string`
- But `task.revisions` is `TaskRevisionResponse[]` (array)
- Cannot assign array to string type

**Severity:** Critical  
**Impact:** TypeScript compilation fails. Revision workflow broken.  
**Fix:** Extract reason from first revision or aggregate revisions properly.

---

### 3. useMangakaEditorial.ts - Non-Existent Fields Access
**File:** [Client/hooks/useMangakaEditorial.ts](Client/hooks/useMangakaEditorial.ts#L25-L40)  
**Lines:** 25-40  
**Error Type:** Logic/API Mismatch  
**Current Code:**
```typescript
chapterTitle: review.chapterTitle || `Chapter ${review.chapterNumber}`,
// ...
editorName: review.createdBy || 'Editor',
note: lastComment?.content || review.notes,
```

**Issue Description:**  
The code tries to access fields that don't exist in `EditorialReviewResponse`:
- `chapterTitle` → doesn't exist
- `chapterNumber` → doesn't exist  
- `createdBy` → doesn't exist
- `notes` → doesn't exist
- `lastComment?.content` → should be `commentText`

**Severity:** Critical  
**Impact:** Data mapping fails silently, undefined values displayed in UI.  
**Fix:** Use only available fields from `EditorialReviewResponse` (id, chapterId, seriesId, status, etc.).

---

## HIGH SEVERITY ISSUES (Major Functionality Impact)

### 4. useMangakaRankings.ts - Missing Fields in Mapping
**File:** [Client/hooks/useMangakaRankings.ts](Client/hooks/useMangakaRankings.ts#L52-L60)  
**Lines:** 52-60  
**Error Type:** API Contract Mismatch  
**Current Code:**
```typescript
const mappedRankings: MangakaSeriesRanking[] = (rankingSnapshots[0]?.items || []).map(
  (item: RankingItemResponse, index: number) => ({
    seriesId: item.seriesId,
    seriesTitle: item.seriesTitle,  // ← MISSING: doesn't exist in RankingItemResponse
    rank: index + 1,
    votes: item.votes || 0,  // ← MISSING: should be item.voteCount
    trend: (item.trend as 'up' | 'down' | 'stable') || 'stable',
    hasWarning: false,
  })
);
```

**Issue Description:**  
- `RankingItemResponse` doesn't have `seriesTitle` field
- `RankingItemResponse` doesn't have `votes` field (it has `voteCount`)
- Type casting with `as` hides the real issue

**Severity:** High  
**Impact:** Rankings display undefined values or 0 for vote counts.  
**Fix:** Use `item.voteCount` instead of `item.votes`. Remove `seriesTitle` or fetch separately.

---

### 5. useFiles.ts - Incomplete Implementation (Truncated)
**File:** [Client/hooks/useFiles.ts](Client/hooks/useFiles.ts#L1)  
**Lines:** Entire file  
**Error Type:** Code Quality / Logic Error  
**Current Code:**
```
// File is heavily minified and ends with incomplete line:
return {files,isLoading,isUploading,uploadProgress,error,successMessage,uploadFile,downloadFile,previewFile,deleteFile,fetchFiles:load,clearError:()=>setError(null),clearSuccess:()=>setSu [truncated]
```

**Issue Description:**  
- File is minified/condensed on single line
- Function return statement is incomplete (`setSu` truncated)
- Impossible to read and maintain

**Severity:** High  
**Impact:** Code is broken and unusable. Function not properly exported.  
**Fix:** Reformat entire file with proper indentation and complete the return statement.

---

### 6. fileApi.ts - Inconsistent Response Mapping
**File:** [Client/services/file-api.ts](Client/services/file-api.ts#L28-L37)  
**Lines:** 28-37, 47-56  
**Error Type:** API Contract Mismatch  
**Current Code:**
```typescript
uploadFile: (file: File, category: FileCategory = 'Other', metadata?: Record<string, string>) => {
  // ... form data setup ...
  return api.post<ApiResponse<FileUploadResponse>>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((response) => ({
    ...response,
    data: {
      ...response.data,
      data: { ...response.data.data, id: response.data.data.fileId },  // ← Mapping fileId to id
    },
  }));
},

getFileUrl: (id: string) =>
  api.get<ApiResponse<FileUrlResponse>>(`/files/${id}/url`).then((response) => ({
    ...response,
    data: {
      ...response.data,
      data: { ...response.data.data, url: response.data.data.publicUrl ?? '' },  // ← Mapping publicUrl to url
    },
  })),
```

**Issue Description:**  
- Inconsistent response transformation pattern
- Response manipulation happens after API call, causing type confusion
- `FileUploadResponse` has `fileId` but code maps it to `id` 
- `FileUrlResponse` has `publicUrl` but code maps it to `url`
- Consumers may not know which field name to use

**Severity:** High  
**Impact:** Confusion in consuming components about correct field names.  
**Fix:** Use consistent field names in type definitions or normalize at one place only.

---

### 7. useNotifications.ts - Missing Unread Count Initialization
**File:** [Client/hooks/useNotifications.ts](Client/hooks/useNotifications.ts#L55-L75)  
**Lines:** 55-75  
**Error Type:** Missing Error Handling  
**Current Code:**
```typescript
const markAsRead = async (notificationId: string) => {
  try {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationApi.markAsRead(notificationId);  // ← No error handling if fails
  } catch (err: any) {
    setError('Failed to mark notification as read.');
    // Re-fetch to sync state ✓ Good
    await fetchNotifications();
  }
};
```

**Issue Description:**  
- State is optimistically updated before API call
- If API fails, UI is out of sync with backend
- No rollback mechanism for optimistic update

**Severity:** High  
**Impact:** Notification state may not match server state.  
**Fix:** Add rollback logic on error or don't update state until confirmed.

---

## MEDIUM SEVERITY ISSUES (Code Quality / Maintainability)

### 8. usePageAnnotations.ts - Unsafe Type Casting
**File:** [Client/hooks/usePageAnnotations.ts](Client/hooks/usePageAnnotations.ts#L44)  
**Line:** 44  
**Error Type:** Type Safety  
**Current Code:**
```typescript
const res = await mangaApi.createAnnotation(pageId, {
  type: annotationData.type as any,  // ← UNSAFE
  description: annotationData.description,
  notes: annotationData.notes,
  coordinatesJson: annotationData.coordinatesJson,
});
```

**Issue Description:**  
- Using `as any` bypasses TypeScript type checking
- Should validate that `type` matches `AnnotationType` enum
- Allows invalid values to be sent to API

**Severity:** Medium  
**Impact:** Invalid annotation types could be sent to server.  
**Fix:** Validate type against `AnnotationType` enum before casting.

---

### 9. useBoardDashboard.ts - Minified Code
**File:** [Client/hooks/useBoardDashboard.ts](Client/hooks/useBoardDashboard.ts#L1)  
**Lines:** Entire file  
**Error Type:** Code Quality  
**Current Code:**
```typescript
// Entire 200+ line hook is minified in 3-4 dense lines
const fetchBoardData = useCallback(async () => {
  setIsLoading(true); setError(null);
  try {
    const [seriesRes, schedulesRes, issuesRes] = await Promise.all([...]);
    // ... 50+ lines condensed into single line
  } catch (error) { setError(...); }
  finally { setIsLoading(false); }
}, []);
```

**Issue Description:**  
- Entire file is heavily minified/condensed
- Unreadable and impossible to maintain
- Makes code reviews and debugging difficult
- No visible error handling structure

**Severity:** Medium  
**Impact:** Difficult to debug, hard to review, maintenance nightmare.  
**Fix:** Reformat entire file with proper indentation and line breaks.

---

### 10. middleware.ts - Minified Code
**File:** [Client/middleware.ts](Client/middleware.ts#L1)  
**Lines:** 1-6  
**Error Type:** Code Quality  
**Current Code:**
```typescript
import { NextResponse } from 'next/server'; import type { NextRequest } from 'next/server';
const publicPaths=['/','/login','/register','/demo']; const rules:Record<string,string[]>={'/assistant':['assistant','admin'],...};
export function middleware(request:NextRequest){const {pathname}=request.nextUrl;if(pathname.startsWith('/_next')||pathname.startsWith('/api')||pathname.includes('.'))return NextResponse.next();const isPublic=publicPaths.some(...);
// ... 100+ chars per line
```

**Issue Description:**  
- Entire middleware is condensed into 2-3 dense lines
- No proper formatting or readability
- Role normalization logic is buried in minified code

**Severity:** Medium  
**Impact:** Cannot easily modify middleware logic, hard to test.  
**Fix:** Expand with proper formatting and separate concerns.

---

### 11. MangakaDashboardOverview.tsx - Minified Component
**File:** [Client/components/mangaka/MangakaDashboardOverview.tsx](Client/components/mangaka/MangakaDashboardOverview.tsx#L1)  
**Lines:** 1-4  
**Error Type:** Code Quality  
**Current Code:**
```typescript
interface Props{triggerModal:(title:string,content:string)=>void;handleTaskAction:(taskId:string,action:string)=>void;filteredTasks:TaskItem[]}
export default function MangakaDashboardOverview({triggerModal,handleTaskAction,filteredTasks}:Props){return <section><h1>Manga Creation Workflow</h1><button onClick={()=>triggerModal('New Series','Use the Series workspace.')}>New Series</button>{filteredTasks.length===0?<p>No task data is available.</p>:<ul>{filteredTasks.map(task=><li key={task.id}><span>Task {task.id}</span><button onClick={()=>handleTaskAction(task.id,'open')}>Open</button></li>)}</ul>}</section>}
```

**Issue Description:**  
- Entire component JSX is on single line
- No readability or maintainability
- Props interface has no documentation

**Severity:** Medium  
**Impact:** Hard to modify component, difficult to review changes.  
**Fix:** Expand with proper formatting and documentation.

---

### 12. BoardVotingPanel.tsx - Minified Component
**File:** [Client/components/board/BoardVotingPanel.tsx](Client/components/board/BoardVotingPanel.tsx#L1)  
**Lines:** 1-3  
**Error Type:** Code Quality  
**Current Code:**
```typescript
interface Props { proposal: SeriesResponse | null; summary: BoardVoteSummaryResponse | null; onVote: (seriesId: string, decision: VoteDecision, note?: string) => Promise<void>; onFinalize: (seriesId: string) => Promise<void>; isVoting: boolean; isFinalizing: boolean; }
export default function BoardVotingPanel({ proposal, summary, onVote, onFinalize, isVoting, isFinalizing }: Props) { const [note, setNote] = useState(''); if (!proposal) return <p className="text-sm text-slate-500">Chọn một Series để biểu quyết.</p>; const vote = async (decision: VoteDecision) => { await onVote(proposal.id, decision, note.trim() || undefined); setNote(''); }; return <div className="space-y-3"><p className="font-semibold">{proposal.title}</p>{summary ? <div className="grid grid-cols-3...
```

**Issue Description:**  
- Entire component is minified into 2-3 lines
- JSX return statement is unreadable
- Button handlers and state logic buried in single line

**Severity:** Medium  
**Impact:** Impossible to review or modify safely.  
**Fix:** Expand with proper JSX formatting and line breaks.

---

### 13. useAssistantDashboard.ts - Empty Dependency Array
**File:** [Client/hooks/useAssistantDashboard.ts](Client/hooks/useAssistantDashboard.ts#L100)  
**Lines:** 100-102  
**Error Type:** React Hook Dependency Issue  
**Current Code:**
```typescript
useEffect(() => {
  if (displayTasks.length > 0) {
    const found = displayTasks.find(t => t.id === selectedTask?.id);
    if (found) {
      setSelectedTask(found);
    } else {
      setSelectedTask(displayTasks[0]);
    }
  }
}, [apiTasks]);  // ← Should include displayTasks as dependency
```

**Issue Description:**  
- Effect depends on `displayTasks` but only lists `apiTasks`
- This causes the effect to not run when `displayTasks` changes
- Potential infinite loops or stale closures

**Severity:** Medium  
**Impact:** Side effect may not fire correctly, leading to stale state.  
**Fix:** Add `displayTasks` to dependency array or remove if checking `apiTasks`.

---

### 14. useSeries.ts - Missing Error Handler Details
**File:** [Client/hooks/useSeries.ts](Client/hooks/useSeries.ts#L44)  
**Line:** 44-68  
**Error Type:** Incomplete Error Handling  
**Current Code:**
```typescript
const handleApiError = (err: any, action: string) => {
  const status = err.response?.status;
  let msg = `An error occurred while trying to ${action} series.`;

  if (status === 401) {
    msg = 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
  } else if (status === 403) {
    msg = 'Bạn không có quyền thực hiện hành động này.';
  } else if (status === 404) {
    msg = 'Series không tồn tại trên hệ thống.';
  } else if (status >= 500) {
    msg = 'Dịch vụ manga tạm thời không khả dụng. Vui lòng thử lại sau.';
  } else {
    msg = err.response?.data?.message || err.message || msg;
  }

  setError(msg);
};
```

**Issue Description:**  
- Doesn't handle network errors (no status code)
- Doesn't handle timeout errors
- Mix of Vietnamese and English error messages (inconsistent UX)
- No logging for debugging

**Severity:** Medium  
**Impact:** Users see poor error messages, debugging is difficult.  
**Fix:** Add handling for all error types and standardize messages.

---

## LOW SEVERITY ISSUES (Minor Improvements)

### 15. useNotifications.ts - Poll Interval Not Cleaned
**File:** [Client/hooks/useNotifications.ts](Client/hooks/useNotifications.ts#L20-L24)  
**Lines:** 20, 95+  
**Error Type:** Potential Memory Leak  
**Issue Description:**  
```typescript
const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
// Poll interval is set but no cleanup visible in useEffect
// Could cause memory leak if component unmounts during polling
```

**Severity:** Low  
**Impact:** Potential memory leak if polling is active.  
**Fix:** Add cleanup function to useEffect that clears interval on unmount.

---

### 16. fileApi.ts - Method Line Formatting
**File:** [Client/services/file-api.ts](Client/services/file-api.ts#L66)  
**Line:** 66  
**Error Type:** Code Quality  
**Current Code:**
```typescript
createVersion: (id: string, file: File) => { const data=new FormData(); data.append('file',file); return api.post<ApiResponse<FileVersionResponse>>(`/files/${id}/versions`,data,{headers:{'Content-Type':'multipart/form-data'}}); },
```

**Issue Description:**  
- Single method condensed into one line
- Inconsistent with other API methods which are multi-line

**Severity:** Low  
**Impact:** Minor inconsistency in code style.  
**Fix:** Expand to multi-line format like other methods.

---

### 17. useTasks.ts - Missing Success Message Clear
**File:** [Client/hooks/useTasks.ts](Client/hooks/useTasks.ts#L60)  
**Lines:** 60+  
**Error Type:** UX Issue  
**Issue Description:**  
```typescript
const startTask = async (id: string) => {
  setIsStarting(true); setError(null); setSuccessMessage(null);
  try {
    // ...
    await fetchTasks(); setSuccessMessage('Task started.');  // ← Message not auto-cleared
  }
};
```

**Severity:** Low  
**Impact:** Success messages may persist longer than expected.  
**Fix:** Add auto-clear timer for success messages (e.g., 3 seconds).

---

### 18. useReader.ts - Unused Query Result
**File:** [Client/hooks/useReader.ts](Client/hooks/useReader.ts#L76-L82)  
**Lines:** 76-82  
**Error Type:** Unused Variable  
**Current Code:**
```typescript
const continueReading = useQuery({
  queryKey: ['continue-reading'],
  queryFn: async () => {
    const res = await readerApi.continueReading();
    return res.data.data || null;
  },
});
// This hook doesn't return continueReading, so it's not usable
```

**Severity:** Low  
**Impact:** Hook defines query but doesn't expose it to consumers.  
**Fix:** Include in return object or remove if not needed.

---

### 19. Types File Organization
**File:** [Client/types/*.ts](Client/types)  
**Error Type:** Code Organization  
**Issue Description:**  
- Type files are well-structured but lack comments
- No documentation about which types match backend DTOs
- No version tracking for type contracts

**Severity:** Low  
**Impact:** Difficult to understand backend contract relationships.  
**Fix:** Add JSDoc comments linking to backend service DTOs.

---

### 20. API Base URL Not Validated
**File:** [Client/lib/api.ts](Client/lib/api.ts#L4)  
**Line:** 4  
**Error Type:** Configuration Risk  
**Current Code:**
```typescript
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5200';
```

**Issue Description:**  
- No validation that baseURL is properly set
- Silent fallback to localhost may cause production issues
- No warning in console if env var is missing

**Severity:** Low  
**Impact:** Could accidentally connect to wrong server in production.  
**Fix:** Add console warning if using fallback URL.

---

## SUMMARY & QUICK REFERENCE

| Issue # | File | Type | Severity | Quick Fix |
|---------|------|------|----------|-----------|
| 1 | useNotifications.ts | Type Error | Critical | Map only existing fields |
| 2 | useAssistantRevisions.ts | Type Error | Critical | Extract reason string from revisions array |
| 3 | useMangakaEditorial.ts | API Mismatch | Critical | Use only existing response fields |
| 4 | useMangakaRankings.ts | API Mismatch | High | Use `voteCount` not `votes` |
| 5 | useFiles.ts | Truncated | High | Reformat minified code |
| 6 | fileApi.ts | Inconsistent | High | Standardize response mapping |
| 7 | useNotifications.ts | Error Handling | High | Add rollback on optimistic update failure |
| 8 | usePageAnnotations.ts | Type Safety | Medium | Remove `as any` casting |
| 9 | useBoardDashboard.ts | Code Quality | Medium | Reformat minified code |
| 10 | middleware.ts | Code Quality | Medium | Expand minified formatting |
| 11 | MangakaDashboardOverview.tsx | Code Quality | Medium | Expand JSX formatting |
| 12 | BoardVotingPanel.tsx | Code Quality | Medium | Expand JSX formatting |
| 13 | useAssistantDashboard.ts | React Hook | Medium | Fix useEffect dependencies |
| 14 | useSeries.ts | Error Handling | Medium | Add network error handling |
| 15 | useNotifications.ts | Memory Leak | Low | Add interval cleanup |
| 16 | fileApi.ts | Formatting | Low | Expand to multi-line |
| 17 | useTasks.ts | UX | Low | Add auto-clear for success messages |
| 18 | useReader.ts | Logic | Low | Expose continueReading in return |
| 19 | Types | Organization | Low | Add JSDoc comments |
| 20 | api.ts | Config | Low | Warn if using fallback baseURL |

---

## RECOMMENDED ACTIONS (Priority Order)

### Phase 1: Block-Fixes (Do Now - Cannot Deploy)
1. Fix issue #1: useNotifications.ts type errors
2. Fix issue #2: useAssistantRevisions.ts type errors  
3. Fix issue #3: useMangakaEditorial.ts field access
4. Fix issue #5: useFiles.ts truncated code

### Phase 2: Data Integrity (High Priority)
1. Fix issue #4: useMangakaRankings.ts missing fields
2. Fix issue #6: fileApi.ts response mapping
3. Fix issue #7: useNotifications.ts optimistic update

### Phase 3: Code Quality (Medium Priority)
1. Fix issue #9-12: Reformat all minified code
2. Fix issue #13-14: Hook dependencies and error handling

### Phase 4: Polish (Low Priority)
1. Fix issues #15-20: Memory leaks, UX, organization

---

## Testing Recommendations

After fixing issues:
1. Run `npm run type-check` to verify all TypeScript errors resolved
2. Run component tests to ensure API mocking matches real types
3. Manual test: Create notification, start task, submit revision flow
4. Manual test: Board voting and ranking calculation
5. Memory profiling: Check for leaks in notification polling

---

**Report Generated:** 2026-07-23  
**Audit Performed By:** Senior Frontend Developer Review  
**Next Review:** After Phase 1 fixes applied
