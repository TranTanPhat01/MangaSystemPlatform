# MangaSystemPlatform Server

Server-side foundation for MangaSystemPlatform using .NET 8 microservices, Clean Architecture project layout, YARP gateway, PostgreSQL, RabbitMQ, Redis, MinIO, and a Python FastAPI AI service skeleton.

## Documentation

Tai lieu tieng Viet:

- [Tong quan Backend](./docs/backend-overview.md)
- [Nhat ky trien khai cac phase](./docs/phase-implementation-log.md)
- [Huong dan chay local va kiem thu](./docs/local-runbook.md)

## Build

```bash
dotnet build
```

## Infrastructure

```bash
docker compose up -d
```

Dashboards:

- RabbitMQ: `http://localhost:15672`
- MinIO: `http://localhost:9001`
- Seq logs: `http://localhost:5341`

## Observability

Each API writes structured Serilog events to console and Seq. Request logs include method, path, status code, elapsed time, `CorrelationId`, and authenticated `UserId` when present.

Health endpoints:

- Each API: `GET /health`
- Gateway aggregation: `GET /health/services`

Run infrastructure first:

```bash
docker compose up -d
```

Then open Seq at `http://localhost:5341` and exercise login, task creation, file upload, review submit, and approval flows. Filter by `Application`, `CorrelationId`, `EventType`, or `MessageId` to verify request, exception, and RabbitMQ event logs.
