# Internal gRPC Test Completion Report

## 1. Executive Summary

Da bo sung automated test coverage cho internal gRPC cua MangaSystemPlatform:

- Identity gRPC contract tests.
- File gRPC contract tests.
- Manga Management gRPC contract tests.
- Internal API key security tests.
- Business-flow tests cho task/page/submission/editorial review.
- Resilience-style tests cho lookup failure/service-down behavior bang fake clients.
- Internal gRPC configuration health check.
- PowerShell smoke scripts dung `grpcurl`.

Verification da chay thanh cong:

```text
dotnet build MangaSystemPlatform.Server.sln
Build succeeded.
0 Warning(s)
0 Error(s)

dotnet test MangaSystemPlatform.Server.sln
Passed: 26
Failed: 0
Skipped: 0
```

## 2. Test Projects Added

Added project:

```text
tests/MangaSystemPlatform.GrpcIntegrationTests
```

Test stack:

- xUnit
- FluentAssertions
- Microsoft.AspNetCore.TestHost
- Microsoft.AspNetCore.Mvc.Testing
- Grpc.Net.Client
- Grpc.AspNetCore
- Google.Protobuf

The project is added to:

```text
MangaSystemPlatform.Server.sln
```

## 3. gRPC Contract Tests

### Identity gRPC

File:

```text
tests/MangaSystemPlatform.GrpcIntegrationTests/IdentityGrpcContractTests.cs
```

Covered:

- `CheckUserExists` with active user returns `exists=true`, `is_active=true`.
- `CheckUserExists` with missing user returns `exists=false`.
- `CheckUserExists` with invalid Guid returns `exists=false`.
- `GetUserSummary` with active user returns user id, email, display name and roles.
- `CheckUserRole` with Assistant user returns `has_role=true`.
- `CheckUserRole` with non-Assistant user returns `has_role=false`.
- Missing or wrong `x-internal-api-key` returns `Unauthenticated`.

### File gRPC

File:

```text
tests/MangaSystemPlatform.GrpcIntegrationTests/FileGrpcContractTests.cs
```

Covered:

- `FileExists` with active file returns `exists=true`.
- `FileExists` with missing file returns `exists=false`.
- `GetFileMetadata` returns file id, file name, content type, size, category and URL.
- `GetFileMetadata` does not expose storage path or internal storage provider.
- Wrong `x-internal-api-key` returns `Unauthenticated`.

### Manga gRPC

File:

```text
tests/MangaSystemPlatform.GrpcIntegrationTests/MangaGrpcContractTests.cs
```

Covered:

- `GetSeriesById` with existing series returns series id, title, status and author user id.
- `GetSeriesById` with missing series returns empty response.
- `GetChapterById` with existing chapter returns chapter id, series id, title, number and status.
- `GetChapterById` with missing chapter returns empty response.
- Wrong `x-internal-api-key` returns `Unauthenticated`.

## 4. Business Flow Tests

File:

```text
tests/MangaSystemPlatform.GrpcIntegrationTests/BusinessFlowTests.cs
```

Covered:

### Create Task

- Active Assistant user creates task successfully.
- Missing/inactive user returns validation error.
- Active user without Assistant role returns validation error.
- Validation failure does not call save.
- Validation failure does not publish `TaskAssignedEvent`.

### Create Page

- Existing active file creates page successfully.
- Missing file returns validation error.
- Validation failure does not call save.

### Submit Task

- Existing active file submits task successfully.
- Missing file returns validation error.
- Validation failure does not call save.
- Validation failure does not publish `TaskSubmittedEvent`.

### Create EditorialReview

- Valid chapter and series creates review successfully.
- Missing chapter returns validation error.
- Mismatched chapter/series returns validation error.
- Validation failure does not call save.

## 5. Security Tests

Security tests validate internal gRPC API key enforcement through the real server interceptor:

```text
shared/Manga.BuildingBlocks/Grpc/InternalGrpcServerInterceptor.cs
```

Covered:

- Missing `x-internal-api-key` -> `Unauthenticated`.
- Wrong `x-internal-api-key` -> `Unauthenticated`.
- Valid `x-internal-api-key` -> request reaches service implementation.

## 6. Resilience Tests

Business-flow tests model service-down/failed lookup by returning safe `false`/`null` from fake clients:

- Identity down/failed lookup -> Manga create task returns validation error and does not publish.
- File down/failed lookup -> Manga create page or submit task returns validation error.
- Manga down/failed lookup -> Editorial create review returns validation error.

The production client behavior that enables this is:

- gRPC clients catch `RpcException`.
- They return `false` or `null` instead of leaking raw gRPC exceptions to Application.
- Command write is not retried, avoiding double-write.

Timeout is covered by production client deadline config and manual smoke checklist. A deterministic automated timeout test was not added because the current clients are thin wrappers over generated gRPC clients and the test project uses in-memory fakes for business-flow resilience.

## 7. Smoke Test Scripts

Added folder:

```text
scripts/grpc-smoke-tests
```

Scripts:

- `test-identity-grpc.ps1`
- `test-file-grpc.ps1`
- `test-manga-grpc.ps1`
- `test-business-flow.ps1`

The gRPC scripts use `grpcurl` if available and print sample commands if it is missing.

Examples covered:

- Identity `CheckUserExists`
- Identity `GetUserSummary`
- Identity `CheckUserRole`
- File `FileExists`
- File `GetFileMetadata`
- Manga `GetSeriesById`
- Manga `GetChapterById`
- Wrong API key scenario

Business-flow smoke script runs:

```powershell
dotnet test MangaSystemPlatform.Server.sln --filter FullyQualifiedName~BusinessFlowTests
```

## 8. Health Check Added

Added:

```text
shared/Manga.BuildingBlocks/Health/InternalGrpcConfigurationHealthCheck.cs
```

Registered in:

- `services/identity-service/Manga.Identity.Api/Program.cs`
- `services/file-service/Manga.File.Api/Program.cs`
- `services/manga-service/Manga.Management.Api/Program.cs`
- `services/editorial-service/Manga.Editorial.Api/Program.cs`

Checks:

- `InternalGrpc:ApiKey` is not empty.
- Each configured `Grpc:{Service}:Address` exists.
- Each configured gRPC address is a valid absolute HTTP/HTTPS URI.

It does not expose the API key value.

Tests:

```text
tests/MangaSystemPlatform.GrpcIntegrationTests/InternalGrpcHealthCheckTests.cs
```

Covered:

- Valid config returns healthy.
- Missing API key or invalid address returns unhealthy without leaking secret.

## 9. How to Run Tests

Build:

```powershell
dotnet build MangaSystemPlatform.Server.sln
```

Run all tests:

```powershell
dotnet test MangaSystemPlatform.Server.sln
```

Run only gRPC integration tests:

```powershell
dotnet test tests/MangaSystemPlatform.GrpcIntegrationTests/MangaSystemPlatform.GrpcIntegrationTests.csproj
```

Run only business-flow tests:

```powershell
dotnet test MangaSystemPlatform.Server.sln --filter FullyQualifiedName~BusinessFlowTests
```

Run smoke scripts:

```powershell
.\scripts\grpc-smoke-tests\test-identity-grpc.ps1 -UserId "<user-guid>"
.\scripts\grpc-smoke-tests\test-file-grpc.ps1 -FileId "<file-guid>"
.\scripts\grpc-smoke-tests\test-manga-grpc.ps1 -SeriesId "<series-guid>" -ChapterId "<chapter-guid>"
.\scripts\grpc-smoke-tests\test-business-flow.ps1
```

CI recommendation:

```yaml
- name: Build
  run: dotnet build MangaSystemPlatform.Server.sln

- name: Test
  run: dotnet test MangaSystemPlatform.Server.sln --no-build
```

## 10. Known Limitations

- Tests run with in-memory TestServer/fake repositories, not full Docker/Testcontainers.
- Tests validate gRPC contract/server behavior without requiring PostgreSQL/RabbitMQ/Redis.
- REST business-flow tests are Application-level integration tests, not full HTTP controller tests.
- Timeout behavior is validated through client deadline implementation and manual smoke guidance, not by a slow in-memory gRPC server test.
- RabbitMQ is asserted through fake event bus publish counts, not a real broker.

These choices keep the test suite fast, deterministic and runnable in local/CI without external infrastructure.

## 11. Final Checklist

- [x] Created `tests/MangaSystemPlatform.GrpcIntegrationTests`.
- [x] Added test project to solution.
- [x] Added xUnit.
- [x] Added FluentAssertions.
- [x] Added TestServer/gRPC test dependencies.
- [x] Identity gRPC contract tests added.
- [x] File gRPC contract tests added.
- [x] Manga gRPC contract tests added.
- [x] Wrong/missing API key tests added.
- [x] Business-flow tests added.
- [x] Validation-fail no-publish checks added.
- [x] Resilience-style service-down tests added through fake lookup clients.
- [x] Smoke scripts added.
- [x] Internal gRPC config health check added.
- [x] Health check tests added.
- [x] `dotnet build MangaSystemPlatform.Server.sln` passes.
- [x] `dotnet test MangaSystemPlatform.Server.sln` passes.
- [x] REST/Swagger not removed.
- [x] gRPC not exposed through Gateway.
- [x] RabbitMQ workflow not removed.
- [x] Clean Architecture preserved.

