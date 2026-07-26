# Runtime Observability Evidence

Last checked: 2026-07-26 Asia/Saigon

## Runtime Health

Authenticated Gateway health checks:

| Endpoint | Code | Result |
|---|---:|---|
| http://localhost:5200/health/live | 200 | PASS |
| http://localhost:5200/health/ready | 200 | PASS |
| http://localhost:5200/health/services | 200 | PASS |

`/health/services` body:

```json
{
  "gateway": "Healthy",
  "identity": "Healthy",
  "manga": "Healthy",
  "file": "Healthy",
  "editorial": "Healthy",
  "notification": "Healthy"
}
```

Docker health inspection:

| Component | Runtime Status |
|---|---|
| Gateway | healthy |
| Identity | healthy |
| Manga | healthy |
| Editorial | healthy |
| File | healthy |
| Notification | healthy |
| PostgreSQL | healthy |
| RabbitMQ | healthy |
| Redis | healthy |
| MinIO | healthy |

MinIO live endpoint returned HTTP 200. RabbitMQ anonymous management health returned HTTP 401, expected without credentials.

## Log Redaction Scan

Redacted tail-log scan over the last 300 log lines for Gateway, Identity, Manga, Editorial, File, and Notification:

- Sensitive token/password/secret pattern matches: 0
- TraceId/CorrelationId matches were inconsistent across services.
- Server-side stack-trace-like patterns were present in Gateway/Manga logs. This is not client exposure by itself, but remains an observability hygiene item.

## Client Error Response Check

Checked responses:

| Request | Code | Stack Trace Exposed | Connection String Exposed | TraceId Present |
|---|---:|---|---|---|
| `GET /not-a-real-route` | 404 | No | No | No |
| invalid `POST /identity/auth/login` | 400 | No | No | Yes |
| Notification downstream stopped via Gateway route | 502 | No | No | Yes, response body `traceId` |

Observed safe 502 body while Notification service was stopped:

```json
{"code":"DOWNSTREAM_UNAVAILABLE","message":"The requested service is temporarily unavailable.","traceId":"0HNNASF2EKGVB:00000001"}
```

## Result

PARTIAL PASS.

Runtime health is healthy, log redaction scan did not find secret/token/password patterns, sampled Gateway downstream failure returned a safe 502 with traceId and no stack trace in the client body, and WSS evidence records source event IDs through Notification persistence. Acceptance remains blocked because TraceId/CorrelationId is not proven consistently across all required HTTP status codes and across Gateway -> service -> Outbox -> RabbitMQ -> Inbox propagation.
