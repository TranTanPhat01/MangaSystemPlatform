# Internal gRPC Phase 2-3 Implementation Report

## 1. Executive Summary

Da trien khai tiep internal gRPC cho MangaSystemPlatform dua tren phase 1.

Scope da hoan thanh gom:

- Phase 2: mo rong Identity lookup voi `GetUserSummary` va `CheckUserRole`.
- Phase 3: them File lookup voi `FileExists` va `GetFileMetadata`.
- Phase 4: them Manga Management lookup cho Editorial voi `GetSeriesById` va `GetChapterById`.
- Them internal gRPC API key security qua header `x-internal-api-key`.
- Ap dung validation moi vao cac business flow tao task, tao page, submit task va tao editorial review.
- Giu nguyen REST qua Gateway, Swagger va RabbitMQ event workflow.

Ket qua build:

```text
dotnet build MangaSystemPlatform.Server.sln
Build succeeded.
0 Warning(s)
0 Error(s)
```

## 2. Scope Completed

### Completed

- Identity Service expose them `GetUserSummary`.
- Identity Service expose them `CheckUserRole`.
- Manga Management Service goi `CheckUserRole(userId, "Assistant")` khi tao task.
- File Service expose `FileExists`.
- File Service expose `GetFileMetadata`.
- Manga Management Service goi `FileExists` khi tao page co `FileId`.
- Manga Management Service goi `FileExists` khi submit task co `FileId`.
- Manga Management Service expose `GetSeriesById`.
- Manga Management Service expose `GetChapterById`.
- Editorial Service goi Manga gRPC de validate chapter/series truoc khi tao `EditorialReview`.
- Internal gRPC server interceptor validate `x-internal-api-key`.
- Internal gRPC client interceptor tu dong gan `x-internal-api-key`.
- gRPC logging co method, status, elapsed time va correlation id neu request header co.

### Not Completed

- Chua viet automated integration tests cho gRPC calls.
- Chua them endpoint health rieng chi de validate gRPC config.

Ly do:

- Repository hien tai chua co test harness/container fixture cho multi-service gRPC integration.
- Existing health check infrastructure van duoc giu; report nay bo sung manual health checklist cho gRPC ports/config.

## 3. Architecture Decision

Frontend van chi goi REST API qua YARP Gateway. gRPC khong expose qua Gateway va khong phuc vu frontend.

gRPC duoc dung cho synchronous internal lookup:

- Manga -> Identity: validate user/role.
- Manga -> File: validate file metadata/accessibility.
- Editorial -> Manga: validate chapter/series ownership.

RabbitMQ van dung cho async workflow/event/notification:

- `TaskAssignedEvent` van publish sau khi task tao thanh cong.
- `TaskSubmittedEvent` van publish sau khi submission tao thanh cong.
- Existing notification/editorial event consumers khong bi thay bang gRPC.

Clean Architecture duoc giu:

- Application layer chi phu thuoc interfaces.
- Generated gRPC clients nam trong Infrastructure.
- Server gRPC implementations dung repository/application abstractions cua service minh.
- Khong reference `.Api` project cua service khac.
- Khong query database service khac.
- Khong copy EF Entity giua services.

## 4. Files Changed

### Shared Contracts

- `shared/Manga.Contracts/Protos/identity.proto`
- `shared/Manga.Contracts/Protos/file.proto`
- `shared/Manga.Contracts/Protos/manga.proto`
- `shared/Manga.Contracts/Manga.Contracts.csproj`

### Shared BuildingBlocks

- `shared/Manga.BuildingBlocks/Grpc/InternalGrpcOptions.cs`
- `shared/Manga.BuildingBlocks/Grpc/InternalGrpcServerInterceptor.cs`
- `shared/Manga.BuildingBlocks/Grpc/InternalGrpcClientInterceptor.cs`
- `shared/Manga.BuildingBlocks/Manga.BuildingBlocks.csproj`

### Identity Service

- `services/identity-service/Manga.Identity.Api/GrpcServices/IdentityGrpcServiceImpl.cs`
- `services/identity-service/Manga.Identity.Api/Program.cs`
- `services/identity-service/Manga.Identity.Api/appsettings.json`

### File Service

- `services/file-service/Manga.File.Api/GrpcServices/FileGrpcServiceImpl.cs`
- `services/file-service/Manga.File.Api/Program.cs`
- `services/file-service/Manga.File.Api/Manga.File.Api.csproj`
- `services/file-service/Manga.File.Api/appsettings.json`

### Manga Management Service

- `services/manga-service/Manga.Management.Api/GrpcServices/MangaManagementGrpcServiceImpl.cs`
- `services/manga-service/Manga.Management.Api/Program.cs`
- `services/manga-service/Manga.Management.Api/Manga.Management.Api.csproj`
- `services/manga-service/Manga.Management.Api/appsettings.json`
- `services/manga-service/Manga.Management.Application/Abstractions/IIdentityLookupClient.cs`
- `services/manga-service/Manga.Management.Application/Abstractions/IFileLookupClient.cs`
- `services/manga-service/Manga.Management.Application/DTOs/UserSummaryDto.cs`
- `services/manga-service/Manga.Management.Application/DTOs/FileMetadataDto.cs`
- `services/manga-service/Manga.Management.Application/Services/TaskService.cs`
- `services/manga-service/Manga.Management.Application/Services/PageService.cs`
- `services/manga-service/Manga.Management.Infrastructure/GrpcClients/IdentityGrpcClient.cs`
- `services/manga-service/Manga.Management.Infrastructure/GrpcClients/FileGrpcClient.cs`
- `services/manga-service/Manga.Management.Infrastructure/DependencyInjection/MangaManagementInfrastructureServiceCollectionExtensions.cs`
- `services/manga-service/Manga.Management.Infrastructure/Manga.Management.Infrastructure.csproj`

### Editorial Service

- `services/editorial-service/Manga.Editorial.Application/Abstractions/IMangaLookupClient.cs`
- `services/editorial-service/Manga.Editorial.Application/DTOs/MangaLookupDtos.cs`
- `services/editorial-service/Manga.Editorial.Application/Services/EditorialReviewService.cs`
- `services/editorial-service/Manga.Editorial.Infrastructure/GrpcClients/MangaGrpcClient.cs`
- `services/editorial-service/Manga.Editorial.Infrastructure/DependencyInjection/EditorialInfrastructureServiceCollectionExtensions.cs`
- `services/editorial-service/Manga.Editorial.Infrastructure/Manga.Editorial.Infrastructure.csproj`
- `services/editorial-service/Manga.Editorial.Api/appsettings.json`

## 5. Proto Contracts

### identity.proto

```proto
syntax = "proto3";

option csharp_namespace = "Manga.Contracts.Identity.V1";

package manga.identity.v1;

service IdentityGrpcService {
  rpc CheckUserExists (CheckUserExistsRequest) returns (CheckUserExistsResponse);
  rpc GetUserSummary (GetUserSummaryRequest) returns (GetUserSummaryResponse);
  rpc CheckUserRole (CheckUserRoleRequest) returns (CheckUserRoleResponse);
}

message CheckUserExistsRequest {
  string user_id = 1;
}

message CheckUserExistsResponse {
  bool exists = 1;
  bool is_active = 2;
}

message GetUserSummaryRequest {
  string user_id = 1;
}

message GetUserSummaryResponse {
  string user_id = 1;
  string display_name = 2;
  string email = 3;
  repeated string roles = 4;
  bool is_active = 5;
}

message CheckUserRoleRequest {
  string user_id = 1;
  string role = 2;
}

message CheckUserRoleResponse {
  bool has_role = 1;
  bool is_active = 2;
}
```

### file.proto

```proto
syntax = "proto3";

option csharp_namespace = "Manga.Contracts.File.V1";

package manga.file.v1;

service FileGrpcService {
  rpc FileExists (FileExistsRequest) returns (FileExistsResponse);
  rpc GetFileMetadata (GetFileMetadataRequest) returns (GetFileMetadataResponse);
}

message FileExistsRequest {
  string file_id = 1;
}

message FileExistsResponse {
  bool exists = 1;
  string category = 2;
  string content_type = 3;
}

message GetFileMetadataRequest {
  string file_id = 1;
}

message GetFileMetadataResponse {
  string file_id = 1;
  string file_name = 2;
  string content_type = 3;
  int64 size = 4;
  string category = 5;
  string url = 6;
}
```

### manga.proto

```proto
syntax = "proto3";

option csharp_namespace = "Manga.Contracts.Management.V1";

package manga.management.v1;

service MangaManagementGrpcService {
  rpc GetSeriesById (GetSeriesByIdRequest) returns (GetSeriesByIdResponse);
  rpc GetChapterById (GetChapterByIdRequest) returns (GetChapterByIdResponse);
}

message GetSeriesByIdRequest {
  string series_id = 1;
}

message GetSeriesByIdResponse {
  string series_id = 1;
  string title = 2;
  string status = 3;
  string author_user_id = 4;
}

message GetChapterByIdRequest {
  string chapter_id = 1;
}

message GetChapterByIdResponse {
  string chapter_id = 1;
  string series_id = 2;
  string title = 3;
  int32 number = 4;
  string status = 5;
}
```

## 6. gRPC Servers Implemented

### Identity Service

Port:

```text
http://localhost:6207
```

Implemented:

- `CheckUserExists`
- `GetUserSummary`
- `CheckUserRole`

Implementation:

```text
services/identity-service/Manga.Identity.Api/GrpcServices/IdentityGrpcServiceImpl.cs
```

Uses:

- `IUserRepository`
- `UserStatus.Active`

Invalid user id logs warning and returns empty/false response.

### File Service

Port:

```text
http://localhost:6154
```

Implemented:

- `FileExists`
- `GetFileMetadata`

Implementation:

```text
services/file-service/Manga.File.Api/GrpcServices/FileGrpcServiceImpl.cs
```

Uses:

- `IFileAssetRepository`
- `FileStatus.Active`

Metadata intentionally returns public-safe fields only:

- id
- original file name
- content type
- size
- category
- public url

It does not expose storage path or provider internals.

### Manga Management Service

Port:

```text
http://localhost:6078
```

Implemented:

- `GetSeriesById`
- `GetChapterById`

Implementation:

```text
services/manga-service/Manga.Management.Api/GrpcServices/MangaManagementGrpcServiceImpl.cs
```

Uses:

- `IManagementRepository`
- `Series`
- `Chapter`

## 7. gRPC Clients Implemented

### Manga -> Identity

Interface:

```text
services/manga-service/Manga.Management.Application/Abstractions/IIdentityLookupClient.cs
```

Implementation:

```text
services/manga-service/Manga.Management.Infrastructure/GrpcClients/IdentityGrpcClient.cs
```

Methods:

- `CheckUserExistsAsync`
- `GetUserSummaryAsync`
- `CheckUserRoleAsync`

Config:

```json
"Grpc": {
  "Identity": {
    "Address": "http://localhost:6207",
    "TimeoutSeconds": 2
  }
}
```

### Manga -> File

Interface:

```text
services/manga-service/Manga.Management.Application/Abstractions/IFileLookupClient.cs
```

Implementation:

```text
services/manga-service/Manga.Management.Infrastructure/GrpcClients/FileGrpcClient.cs
```

Methods:

- `FileExistsAsync`
- `GetFileMetadataAsync`

Config:

```json
"Grpc": {
  "File": {
    "Address": "http://localhost:6154",
    "TimeoutSeconds": 2
  }
}
```

### Editorial -> Manga

Interface:

```text
services/editorial-service/Manga.Editorial.Application/Abstractions/IMangaLookupClient.cs
```

Implementation:

```text
services/editorial-service/Manga.Editorial.Infrastructure/GrpcClients/MangaGrpcClient.cs
```

Methods:

- `GetSeriesByIdAsync`
- `GetChapterByIdAsync`

Config:

```json
"Grpc": {
  "Manga": {
    "Address": "http://localhost:6078",
    "TimeoutSeconds": 2
  }
}
```

## 8. Business Flows Updated

### Create Task / Assign Assistant

Flow:

```text
Manga REST API
-> TaskService.CreateAsync
-> Identity CheckUserExists
-> Identity CheckUserRole(userId, "Assistant")
-> Create MangaTask
-> SaveChanges
-> Publish TaskAssignedEvent
```

Validation errors:

```text
Assigned user does not exist or is inactive.
Assigned user must have Assistant role.
```

If validation fails:

- Task is not created.
- `TaskAssignedEvent` is not published.

### Create Page With File

Flow:

```text
Manga REST API
-> PageService.CreateAsync
-> File FileExists(fileId)
-> Create Page
-> SaveChanges
```

Validation error:

```text
File does not exist or is not accessible.
```

### Submit Task With File

Flow:

```text
Manga REST API
-> TaskService.SubmitAsync
-> File FileExists(fileId)
-> Create Submission
-> SaveChanges
-> Publish TaskSubmittedEvent
```

Validation error:

```text
File does not exist or is not accessible.
```

If validation fails:

- Submission is not created.
- `TaskSubmittedEvent` is not published.

### Create Editorial Review

Flow:

```text
Editorial REST API
-> EditorialReviewService.CreateAsync
-> Manga GetChapterById
-> Manga GetSeriesById
-> Validate chapter belongs to series
-> Create EditorialReview
-> SaveChanges
```

Validation errors:

```text
Chapter not found.
Series not found.
Chapter does not belong to series.
```

## 9. Internal Security

Added shared internal gRPC security:

```text
shared/Manga.BuildingBlocks/Grpc/InternalGrpcServerInterceptor.cs
shared/Manga.BuildingBlocks/Grpc/InternalGrpcClientInterceptor.cs
```

Header:

```text
x-internal-api-key
```

Config:

```json
"InternalGrpc": {
  "ApiKey": "dev-internal-grpc-key"
}
```

Applied to servers:

- Identity gRPC
- File gRPC
- Manga Management gRPC

Applied to clients:

- Manga Management Infrastructure clients
- Editorial Infrastructure client

If key is missing or wrong, server returns:

```text
Unauthenticated
```

The key is read from configuration and is not hard-coded in code.

## 10. How to Test

### Build

```powershell
dotnet build MangaSystemPlatform.Server.sln
```

Expected:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

### Manual Test Checklist

- Start Identity Service and confirm REST Swagger on `http://localhost:5207/swagger`.
- Confirm Identity gRPC uses `http://localhost:6207` with HTTP/2.
- Start File Service and confirm REST Swagger on `http://localhost:5154/swagger`.
- Confirm File gRPC uses `http://localhost:6154` with HTTP/2.
- Start Manga Management Service and confirm REST Swagger on `http://localhost:5078/swagger`.
- Confirm Manga gRPC uses `http://localhost:6078` with HTTP/2.
- Start Editorial Service.
- Manga creates task with active Assistant user -> success.
- Manga creates task with missing user -> validation error.
- Manga creates task with user without Assistant role -> validation error.
- Manga creates Page with existing active fileId -> success.
- Manga creates Page with wrong fileId -> validation error.
- Manga submits task with existing active fileId -> success.
- Manga submits task with wrong fileId -> validation error.
- Editorial creates review with valid chapterId and seriesId -> success.
- Editorial creates review with wrong chapterId -> validation error.
- Editorial creates review with mismatched chapter/series -> validation error.
- RabbitMQ events still publish after successful task create/submission.
- Change one service `InternalGrpc:ApiKey` to a wrong value and verify gRPC call is rejected as unauthenticated.

## 11. Risks and Mitigations

### Service Down

Risk:

Lookup service is unavailable.

Mitigation:

- Client catches `RpcException`.
- Business flow returns validation-safe `false`/`null`.
- No write occurs when lookup cannot be trusted.

### Timeout

Risk:

Synchronous lookup slows command flow.

Mitigation:

- Each gRPC client uses configurable deadline.
- Default timeout is 2 seconds.

### Wrong HTTP/2 Config

Risk:

gRPC port accepts HTTP/1 only or conflicts with REST.

Mitigation:

- Each gRPC server has a separate HTTP/2 Kestrel endpoint.
- REST ports remain separate for Swagger/controllers.

### Service Coupling

Risk:

Application code couples to generated gRPC clients or other service implementations.

Mitigation:

- Application layer depends on lookup interfaces only.
- Infrastructure owns generated gRPC clients.
- Shared contract is `.proto`, not EF entities.

### Internal API Key Drift

Risk:

Client and server keys differ across local configs.

Mitigation:

- Shared config key name `InternalGrpc:ApiKey`.
- Server rejects wrong key with `Unauthenticated`.
- Manual test checklist includes wrong-key scenario.

## 12. Remaining Work

- Add automated integration tests for Identity/File/Manga gRPC contracts.
- Add grpcurl scripts or a dedicated local smoke-test project.
- Add a dedicated health endpoint/check that validates configured gRPC target addresses and API key presence.
- Consider TLS/mTLS or service mesh identity for non-local environments.
- Consider typed error mapping if REST responses need more structured validation codes.

## 13. Final Checklist

- [x] `identity.proto` extended with `GetUserSummary`.
- [x] `identity.proto` extended with `CheckUserRole`.
- [x] `file.proto` added.
- [x] `manga.proto` added.
- [x] Identity gRPC server implements new lookups.
- [x] File gRPC server implemented.
- [x] Manga Management gRPC server implemented.
- [x] Manga Identity client extended.
- [x] Manga File client added.
- [x] Editorial Manga client added.
- [x] Task assign validates active user.
- [x] Task assign validates Assistant role.
- [x] Page create validates file id.
- [x] Task submission validates file id.
- [x] Editorial review validates chapter.
- [x] Editorial review validates series.
- [x] Editorial review validates chapter belongs to series.
- [x] Internal gRPC API key added.
- [x] gRPC server logging added through interceptor.
- [x] gRPC client logging added through interceptor and client implementations.
- [x] RabbitMQ flow preserved.
- [x] REST/Swagger preserved.
- [x] Gateway not changed to expose gRPC.
- [x] Solution build passes with 0 warnings and 0 errors.

