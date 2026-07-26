# Known Limitations

Last checked: 2026-07-26 Asia/Saigon

## P1 Limitations

- Production Readiness Gate is not accepted: production-like HTTPS/HSTS/CORS, trusted proxy forwarded headers, WSS realtime/reconnect/no-duplicate, and PostgreSQL/MinIO restore mechanics now pass, but existing DB clone upgrade, restored-container API smoke, full partial-failure recovery, full observability propagation, and Playwright clean exit still need evidence.

## P2 Limitations

- Runtime observability is incomplete: gateway responses include `X-Correlation-Id`, but sampled gateway logs still include internal stack traces for server-side errors. Client responses sampled did not expose the stack trace.
- Controlled Notification service fault-injection was partially performed: Gateway returned safe 502 with traceId and recovered to healthy. Admin Health UI, SignalR reconnect, MinIO failure/recovery, and full unrelated workflow smoke remain unverified.
- Full Playwright regression is not accepted: test-only axios TLS trust and redirect handling were fixed, and the isolated accessibility spec now exits naturally instead of timing out, but it exits 1 because browser-side frontend API/SignalR calls still hit production CORS/origin mismatch and render `Network Error` UI that fails axe.
- ESLint has 0 errors and 240 warnings; warnings are tracked as cleanup, not closure blockers.

## P3 Limitations

- Axe still reports moderate violations on several surfaces, but no critical or serious violations remain.
