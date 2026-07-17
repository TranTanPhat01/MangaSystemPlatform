# P0 Ownership/Authorization Report

## Files changed

- Manga: added `ICurrentUserService`, `IManagementAccessService`, `ManagementAccessService`, API claim adapter; updated Studio, Series, Chapter, Page, Annotation and Task services plus Manga role attributes.
- File: added role-aware current-user context; protected metadata, download, URL, versions and delete by uploader/Admin.
- Editorial: added role-aware current-user context; constrained review creation, visibility, comments and decisions to requester, assigned reviewer, Editorial Board view or Admin.
- Notification: Admin bypass added while preserving owner-only access for normal users.
- Tests: added `OwnershipAuthorizationTests`.

## Rules implemented

- Studio owner/Admin can manage studio and series; studio member can view its series; unrelated users receive a not-found/permission failure.
- Editorial Board can view series/proposal data; only Board/Admin can decide proposal.
- Chapter create/read/update/submit checks series ownership at application layer.
- Page create/read/status checks the owning series chain. An Assistant may read a page only when it has a task assigned on that page; it cannot create or change page status.
- Annotation create/list/delete checks the owning page chain. An Assistant can only view annotations through an assigned page and cannot mutate them.
- Task create/approve/request-revision checks the owning page; task read/start/submit checks the assignee. Admin bypasses each guard.
- Assistant is removed from page create/status routes; Tantou Editor is removed from direct Manga chapter/page/annotation mutation routes.
- File resource operations require uploader or Admin.
- Editorial review actions require the assigned reviewer or Admin; Board can view; requester can view own request.
- Notification read/delete requires owner, except Admin.

## Tests added

- Owner access/manage series.
- Unrelated user denied series access/manage.
- Assigned assistant can access/work task but cannot manage page.
- Admin can access/manage any series.
- Assigned Assistant can start and submit an assigned task.
- Unrelated Assistant cannot read/start another task or update its page.
- Mangaka owner can create a task on an owned page; unrelated Mangaka cannot delete its annotation.
- Admin can manage page, annotation and task outside ownership.

## Remaining risks

- File Service has no persisted link to Manga task/page, so it can enforce uploader/Admin but cannot independently prove all cross-service file relationships.
- No end-to-end HTTP/JWT tests or database-backed authorization tests were added; current tests are application-level with fakes.
- `GetMineAsync` returns tasks assigned to or created by the caller. This is correct for Mangaka/Admin workflows, but any future non-Mangaka caller must remain blocked at controller/policy level or the query should become role-aware.

## Verification

- `dotnet build MangaSystemPlatform.Server.sln --no-restore`: succeeded, 0 warnings, 0 errors.
- `dotnet test MangaSystemPlatform.Server.sln --no-build`: passed, 44/44 tests.
