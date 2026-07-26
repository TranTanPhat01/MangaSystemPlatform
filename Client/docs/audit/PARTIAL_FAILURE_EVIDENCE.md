# Partial Failure Evidence

Checked: 2026-07-26 Asia/Saigon

## Result

PARTIAL / NOT ACCEPTED.

## Notification service fault injection

Controlled runtime action:

- `docker stop manga-prodlike-notification-api-1`: exit code 0.
- `docker start manga-prodlike-notification-api-1`: exit code 0.
- Recovery Docker status: `Up ... (healthy)`.

Observed while Notification service was stopped:

| Check | Result |
|---|---|
| Gateway `/health/live` | PASS: HTTP 200, no leak patterns in sampled body |
| Notification route through Gateway | PASS: HTTP 502 safe JSON |
| Safe error body | PASS: `code=DOWNSTREAM_UNAVAILABLE`, safe message, `traceId` present |
| Client stack trace exposure | PASS: sampled 502 body did not include stack trace, source path, connection string, token, secret, or password |
| Unrelated services | PARTIAL: gateway stayed healthy; sampled identity/editorial health paths returned their normal route-level 404, not gateway failure |
| Recovery | PASS: after start, Notification container returned healthy and the proxied route returned its alive-before behavior |

Observed 502 body:

```json
{"code":"DOWNSTREAM_UNAVAILABLE","message":"The requested service is temporarily unavailable.","traceId":"0HNNASF2EKGVB:00000001"}
```

## Remaining blockers

- Admin Health UI render during the outage was not browser-verified.
- SignalR reconnect/fallback after Notification recovery was not verified.
- MinIO failure/recovery was not executed.
- A full unrelated workflow smoke during the outage was not executed.

Final Production Readiness remains blocked until these are completed.
