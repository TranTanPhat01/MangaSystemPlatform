# Internal gRPC Implementation Report

## 1. Executive Summary

Da trien khai gRPC noi bo cho phase dau tien cua MangaSystemPlatform:

```text
Manga Management Service -> Identity Service -> CheckUserExists
```

Khi Manga Management Service tao task va gan assistant/user phu trach, service se goi Identity Service bang gRPC de kiem tra `AssignedToUserId` co ton tai va dang active hay khong.

Neu user khong ton tai, inactive, user id khong hop le, hoac Identity gRPC khong phan hoi an toan, Manga Service tra validation error:

```text
Assigned user does not exist or is inactive.
```

Neu user hop le, Manga Service tiep tuc tao task va publish `TaskAssignedEvent` qua RabbitMQ nhu flow hien tai.

## 2. Architecture Decision

### REST for Frontend

Frontend van chi goi REST API qua YARP Gateway. Cac REST controller, Swagger va gateway routing khong bi thay the bang gRPC.

Ly do:

- REST phu hop voi browser/frontend va API public surface.
- Gateway hien tai da duoc thiet ke cho REST traffic.
- Khong expose internal service contract ra frontend.

### gRPC for Synchronous Internal Lookup

gRPC duoc dung cho giao tiep synchronous noi bo service-to-service giua Manga Management Service va Identity Service.

Use case `CheckUserExists` can phan hoi ngay truoc khi ghi task xuong database, nen gRPC phu hop hon event async.

Ly do:

- Contract ro rang qua `.proto`.
- Hieu nang tot cho internal service call.
- Phu hop voi request/response lookup ngan.
- Khong can Manga Service query database cua Identity Service.

### RabbitMQ for Asynchronous Workflow

RabbitMQ van giu vai tro event workflow, notification va side effects.

Trong flow tao task:

- gRPC chi validate user truoc khi ghi.
- RabbitMQ van publish `TaskAssignedEvent` sau khi task tao thanh cong.
- Khong thay RabbitMQ bang gRPC.
- Khong retry command tao task bang gRPC de tranh double write.

## 3. Files Changed

### Shared Contract

- `shared/Manga.Contracts/Protos/identity.proto`
- `shared/Manga.Contracts/Manga.Contracts.csproj`

### Identity Service

- `services/identity-service/Manga.Identity.Api/Program.cs`
- `services/identity-service/Manga.Identity.Api/GrpcServices/IdentityGrpcServiceImpl.cs`
- `services/identity-service/Manga.Identity.Api/appsettings.json`
- `services/identity-service/Manga.Identity.Api/Manga.Identity.Api.csproj`

### Manga Management Service

- `services/manga-service/Manga.Management.Application/Abstractions/IIdentityLookupClient.cs`
- `services/manga-service/Manga.Management.Application/Services/TaskService.cs`
- `services/manga-service/Manga.Management.Infrastructure/GrpcClients/IdentityGrpcClient.cs`
- `services/manga-service/Manga.Management.Infrastructure/DependencyInjection/MangaManagementInfrastructureServiceCollectionExtensions.cs`
- `services/manga-service/Manga.Management.Infrastructure/Manga.Management.Infrastructure.csproj`
- `services/manga-service/Manga.Management.Api/appsettings.json`

## 4. Proto Contract

File:

```text
shared/Manga.Contracts/Protos/identity.proto
```

Content:

```proto
syntax = "proto3";

option csharp_namespace = "Manga.Contracts.Identity.V1";

package manga.identity.v1;

service IdentityGrpcService {
  rpc CheckUserExists (CheckUserExistsRequest) returns (CheckUserExistsResponse);
}

message CheckUserExistsRequest {
  string user_id = 1;
}

message CheckUserExistsResponse {
  bool exists = 1;
  bool is_active = 2;
}
```

Contract nay duoc dat trong shared project de Identity Service generate server base class va Manga Management Infrastructure generate/use client type.

## 5. Identity gRPC Server

### Program.cs

Identity API da dang ky gRPC:

```csharp
builder.Services.AddGrpc();
```

Va map gRPC service:

```csharp
app.MapGrpcService<IdentityGrpcServiceImpl>();
```

Swagger REST, controller REST, authentication, authorization va health check van giu nguyen.

### Kestrel Port

Identity Service duoc cau hinh them port gRPC rieng:

```json
"Kestrel": {
  "Endpoints": {
    "Rest": {
      "Url": "http://localhost:5207",
      "Protocols": "Http1"
    },
    "Grpc": {
      "Url": "http://localhost:6207",
      "Protocols": "Http2"
    }
  }
}
```

REST port hien tai van la `http://localhost:5207`.

gRPC internal port la:

```text
http://localhost:6207
```

### Service Implementation

Implementation dat tai:

```text
services/identity-service/Manga.Identity.Api/GrpcServices/IdentityGrpcServiceImpl.cs
```

Class:

```csharp
public sealed class IdentityGrpcServiceImpl : IdentityGrpcService.IdentityGrpcServiceBase
```

Dependencies:

- `IUserRepository`
- `ILogger<IdentityGrpcServiceImpl>`

Service khong query truc tiep `IdentityDbContext`. No goi Application abstraction/repository hien co:

```csharp
var user = await _userRepository.GetByIdAsync(userId, context.CancellationToken);
```

### CheckUserExists Logic

Input:

```text
user_id: string
```

Rules:

- Neu `user_id` rong hoac khong parse duoc `Guid`: return `exists=false`, `is_active=false`.
- Neu user khong ton tai: return `exists=false`, `is_active=false`.
- Neu user ton tai: return `exists=true`, `is_active = user.Status == UserStatus.Active`.

## 6. Manga gRPC Client

### Application Interface

Interface dat tai:

```text
services/manga-service/Manga.Management.Application/Abstractions/IIdentityLookupClient.cs
```

Content:

```csharp
namespace Manga.Management.Application.Abstractions;

public interface IIdentityLookupClient
{
    Task<bool> CheckUserExistsAsync(Guid userId, CancellationToken cancellationToken = default);
}
```

Application layer chi phu thuoc interface nay, khong reference generated gRPC client truc tiep.

### Infrastructure Implementation

Implementation dat tai:

```text
services/manga-service/Manga.Management.Infrastructure/GrpcClients/IdentityGrpcClient.cs
```

Class:

```csharp
internal sealed class IdentityGrpcClient : IIdentityLookupClient
```

No su dung generated client:

```csharp
IdentityGrpcService.IdentityGrpcServiceClient
```

Va goi RPC:

```csharp
var response = await _client.CheckUserExistsAsync(
    new CheckUserExistsRequest { UserId = userId.ToString() },
    deadline: DateTime.UtcNow.AddSeconds(_timeoutSeconds),
    cancellationToken: cancellationToken);
```

Return:

```csharp
return response.Exists && response.IsActive;
```

### Timeout and Logging

Timeout doc tu config:

```text
Grpc:Identity:TimeoutSeconds
```

Default:

```text
2 seconds
```

Client co logging truoc khi goi gRPC va log warning khi gap `RpcException`.

Khi Identity gRPC bi loi/down/timeout, client return `false` de business flow tra validation error an toan.

### DI Registration

DI dat tai:

```text
services/manga-service/Manga.Management.Infrastructure/DependencyInjection/MangaManagementInfrastructureServiceCollectionExtensions.cs
```

Dang ky:

```csharp
services.AddScoped<IIdentityLookupClient, IdentityGrpcClient>();
services.AddGrpcClient<IdentityGrpcService.IdentityGrpcServiceClient>(options =>
{
    var address = configuration["Grpc:Identity:Address"] ?? "http://localhost:6207";
    options.Address = new Uri(address);
});
```

### Manga Management Configuration

File:

```text
services/manga-service/Manga.Management.Api/appsettings.json
```

Config:

```json
"Grpc": {
  "Identity": {
    "Address": "http://localhost:6207",
    "TimeoutSeconds": 2
  }
}
```

## 7. Business Flow Updated

Flow tao task moi:

```text
Client
-> YARP Gateway
-> Manga Management REST API
-> TaskService.CreateAsync
-> IIdentityLookupClient.CheckUserExistsAsync
-> Identity gRPC CheckUserExists
-> Create MangaTask
-> SaveChanges
-> Publish TaskAssignedEvent via RabbitMQ
```

Validation duoc chen truoc khi tao `MangaTask`:

```csharp
if (!await _identityLookupClient.CheckUserExistsAsync(request.AssignedToUserId, cancellationToken))
{
    return Result<TaskResponse>.Failure("Assigned user does not exist or is inactive.");
}
```

Neu validation fail:

- Khong tao task.
- Khong save database.
- Khong publish `TaskAssignedEvent`.
- Tra validation error cho REST flow hien co.

Neu validation pass:

- Tao `MangaTask`.
- Save database.
- Publish `TaskAssignedEvent` qua RabbitMQ nhu truoc.

## 8. How to Test

### Build Verification

Da chay:

```powershell
dotnet build MangaSystemPlatform.Server.sln
```

Ket qua:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

### Manual Test Checklist

- Start infrastructure: PostgreSQL, RabbitMQ, Redis neu can theo local runbook.
- Start Identity Service.
- Xac nhan REST Swagger van chay tai `http://localhost:5207/swagger`.
- Xac nhan Identity Service listen gRPC port `http://localhost:6207` voi HTTP/2.
- Start Manga Management Service.
- Tao task voi `AssignedToUserId` cua user ton tai va active.
- Ky vong task tao thanh cong.
- Ky vong `TaskAssignedEvent` van duoc publish qua RabbitMQ.
- Tao task voi `AssignedToUserId` khong ton tai.
- Ky vong API tra validation error: `Assigned user does not exist or is inactive.`
- Tao task voi inactive user.
- Ky vong API tra validation error.
- Stop Identity Service roi tao task.
- Ky vong Manga Service xu ly loi an toan, khong tao task, khong publish event.

## 9. Risks and Mitigations

### Identity Service Down

Risk:

Manga Service khong validate duoc assigned user.

Mitigation:

- gRPC client catch `RpcException`.
- Return `false`.
- Business flow tra validation error an toan.
- Khong ghi database khi validation khong chac chan.

### gRPC Timeout

Risk:

Command tao task bi treo neu Identity Service cham.

Mitigation:

- Deadline mac dinh 2 giay.
- Timeout doc tu config de co the dieu chinh theo moi truong.

### HTTP/2 Misconfiguration

Risk:

gRPC can HTTP/2, neu Kestrel sai protocol thi client khong connect duoc.

Mitigation:

- Tach endpoint REST HTTP/1 va gRPC HTTP/2.
- REST port `5207` giu cho Swagger/controller.
- gRPC port `6207` dung cho internal call.

### Tight Coupling Between Services

Risk:

Manga Service bi phu thuoc truc tiep Identity implementation.

Mitigation:

- Chi share `.proto` contract.
- Manga Application chi phu thuoc `IIdentityLookupClient`.
- Generated gRPC client nam trong Infrastructure.
- Khong reference `Identity.Api`.
- Khong copy Identity entity sang Manga.
- Khong query Identity database tu Manga.

### Double Write / Duplicate Event

Risk:

Retry command tao task co the tao duplicate record/event.

Mitigation:

- Khong retry command write.
- gRPC lookup fail thi return validation error.
- RabbitMQ chi publish sau khi task da tao thanh cong.

## 10. Final Checklist

- [x] Proto dat dung `shared/Manga.Contracts/Protos`.
- [x] Proto package la `manga.identity.v1`.
- [x] Proto csharp namespace la `Manga.Contracts.Identity.V1`.
- [x] Proto service la `IdentityGrpcService`.
- [x] RPC `CheckUserExists` da duoc dinh nghia.
- [x] `CheckUserExistsRequest.user_id` la string.
- [x] `CheckUserExistsResponse.exists` la bool.
- [x] `CheckUserExistsResponse.is_active` la bool.
- [x] Identity API da dang ky `AddGrpc()`.
- [x] Identity API da map `IdentityGrpcServiceImpl`.
- [x] Identity gRPC implementation dung `IUserRepository`, khong query DbContext truc tiep.
- [x] Identity gRPC port `http://localhost:6207` cau hinh HTTP/2.
- [x] REST/Swagger Identity van giu port `http://localhost:5207`.
- [x] Manga Application co `IIdentityLookupClient`.
- [x] Manga Infrastructure co `IdentityGrpcClient`.
- [x] Manga Infrastructure dang ky generated gRPC client.
- [x] Manga config co `Grpc:Identity:Address`.
- [x] Manga config co `Grpc:Identity:TimeoutSeconds`.
- [x] Flow tao task validate assigned user truoc khi tao task.
- [x] Validation fail thi khong tao task va khong publish event.
- [x] Validation pass thi tao task va publish `TaskAssignedEvent` nhu hien tai.
- [x] RabbitMQ event flow duoc giu nguyen.
- [x] Khong expose gRPC qua Gateway.
- [x] Khong cho frontend goi gRPC.
- [x] Khong reference `Identity.Api` tu Manga Application.
- [x] Solution build thanh cong.

