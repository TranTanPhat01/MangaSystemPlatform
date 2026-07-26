# Playwright Clean Exit Evidence

Checked: 2026-07-26 Asia/Saigon

## Result

NOT VERIFIED / BLOCKED.

## Evidence captured

- Full Playwright run was attempted and timed out after 300 seconds.
- A Board proposal accessibility issue was fixed before this closure pass.
- Targeted accessibility rerun printed `0 critical / 0 serious`, but the process still timed out during teardown.
- Isolation attempt on 2026-07-26:
  - Command: `cmd /c npx playwright test e2e/accessibility-audit.spec.ts --workers=1 --reporter=line`
  - Result: command timed out after 182 seconds.
  - Tests started: 8.
  - First failure: axios login in `e2e/accessibility-audit.spec.ts` failed with `self-signed certificate`.
  - Process still did not exit cleanly before command timeout.
- TLS/auth setup fix on 2026-07-26:
  - Exported public local certificate to `e2e/support-local-ca.pem` from `Server/certs/api.manga.local.pfx`; private key was not exported.
  - Added `e2e/support/axios.ts` with test-only `https.Agent({ ca })`; no `rejectUnauthorized=false` and no global TLS bypass.
  - Replaced E2E `axios` imports with the test-only wrapper.
  - Rewrote E2E API calls from `http://localhost:5200` to `https://localhost` inside the wrapper to avoid cross-host 307 redirect dropping `Authorization`.
  - Added `e2e/global-setup.ts` to create/grant the hard-coded admin test user without enabling production seed.
  - `cmd /c npx tsc --noEmit`: PASS, exit code 0.
- Isolated rerun after TLS/auth fix:
  - Command: `cmd /c npx playwright test e2e/accessibility-audit.spec.ts --workers=1 --reporter=line`
  - Result: process exited naturally in 59.3 seconds with exit code 1, not a timeout.
  - Passed: 3.
  - Failed: 5.
  - Remaining cause: browser-side frontend API/SignalR calls still fail because production-like CORS allows `https://app.manga.local`, while Playwright Next dev server runs at `http://localhost:3000`. The failed API state renders `Network Error` UI and creates axe critical/serious violations.

## Root cause status

Root cause is partially confirmed. Confirmed contributing issues:

- E2E axios setup does not trust the production-like self-signed local TLS certificate.
- E2E axios requests followed `http://localhost:5200` -> `https://api.manga.local` redirects, causing `Authorization` to be dropped across hosts.
- Browser-side E2E frontend origin is not aligned with production CORS (`http://localhost:3000` vs allowed `https://app.manga.local`), causing runtime network-error UI.

Teardown status:

- The isolated accessibility spec no longer timed out after the TLS/auth setup fix; it exited naturally with code 1 because assertions failed.

Suspected full-suite leak categories remain until the full suite is rerun cleanly:

- Playwright webServer/Next.js child process not exiting.
- Open SignalR connection or polling interval.
- Browser/page/context handle not closed.
- Global teardown waiting on a lingering handle.

## Acceptance not met

`npx playwright test --workers=1` has not been shown to finish naturally with exit code 0 in this pass.
