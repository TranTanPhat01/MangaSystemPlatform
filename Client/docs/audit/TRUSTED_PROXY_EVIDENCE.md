# Trusted Proxy Evidence

Checked: 2026-07-26 Asia/Saigon

## Result

PASS for required forwarded-header behavior using an audit-only separate TLS reverse proxy container.

## Evidence captured

| Test | Result |
|---|---|
| Separate reverse proxy | PASS: audit-only container `manga-trusted-proxy-audit` on Docker network `manga-prodlike_manga-network` |
| Proxy IP | PASS: fixed `172.20.0.250` |
| Gateway trusted source | PASS: `ForwardedHeaders__KnownProxies__0=172.20.0.250`; `KnownNetworks` empty |
| Proxy HTTP -> Gateway HTTP behavior | PASS: HTTP request to proxy returned 307 to `https://api.manga.local/health/live` |
| Proxy HTTPS -> Gateway HTTP behavior | PASS: Node HTTPS request to proxy returned 200 |
| `X-Forwarded-Proto` processing | PASS: HTTPS proxy request did not redirect, proving Gateway recognized scheme `https` |
| `X-Forwarded-Host` processing | PASS: redirect Location from proxy HTTP used `https://api.manga.local/health/live` |
| HSTS | PASS: HTTPS proxy response included `Strict-Transport-Security: max-age=31536000` |
| Redirect loop | PASS: HTTPS via proxy returned 200 directly |
| Direct forged `X-Forwarded-*` to Gateway HTTP port | PASS: returned 307 redirect; forged headers were ignored |

## Accepted command evidence

Gateway env:

```text
ForwardedHeaders__Enabled=true
ForwardedHeaders__KnownProxies__0=172.20.0.250
ForwardedHeaders__KnownNetworks__0=
```

Direct forged request result:

```text
HTTP/1.1 307 Temporary Redirect
Location: https://api.manga.local/health/live
```

HTTPS through proxy result:

```text
status=200 hsts=max-age=31536000 cid=9a017452-58d9-42e5-9410-c3484b9e827a
```

## Note

No Nginx/Caddy/Traefik image was available locally. The proxy used for evidence is a small audit-only .NET reverse proxy under `tools/audit/TrustedProxy`; it is not business functionality and is not a production deployment artifact.

## Final status

Trusted proxy forwarded-header evidence is accepted as PASS for this production-like runtime.
