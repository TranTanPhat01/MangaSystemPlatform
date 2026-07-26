# WSS Realtime Evidence

Checked: 2026-07-26 Asia/Saigon

## Result

PASS.

## Runtime command

```powershell
node tools\audit\wss-realtime-evidence.js
```

Exit code: 0.

The script does not print access tokens or refresh tokens. It creates runtime test users, grants the assignee the Assistant role as test setup because production-like admin seed is disabled, connects to the Gateway WSS hub, triggers real Manga task-assignment events, verifies Notification API/DB state, then tests service restart reconnect/no-duplicate behavior.

## Evidence captured

| Test | Result |
|---|---|
| Anonymous SignalR connection through Gateway WSS | PASS: previously rejected in authenticated WSS evidence |
| Authenticated SignalR connection through Gateway WSS | PASS: connected to `wss://api.manga.local/notifications/hub` |
| Direct Notification service bypass | PASS: script used Gateway hub only |
| Realtime notification delivery over WSS | PASS |
| Correct user targeted | PASS |
| Notification persisted | PASS |
| API unread count updates | PASS |
| Reconnect after Notification service restart | PASS |
| No duplicate after reconnect | PASS |
| Single active connection at end | PASS |

Accepted reconnect/no-duplicate output:

```json
{
  "status": "PASS",
  "hub": "wss://api.manga.local/notifications/hub",
  "directNotificationServiceUsed": false,
  "userId": "539e155e-3088-4a24-85d5-0cadc19a85fa",
  "taskAId": "453576c3-25df-45d7-a1b3-0c17f6952fd6",
  "taskBId": "34a13038-331e-4a9b-b562-21665ca8c4da",
  "notificationAId": "e5f2b45b-d05c-41a2-983a-5c6a45a6ccbc",
  "notificationBId": "590468bb-478f-4f4f-b51d-bb77d057bc3a",
  "sourceEventId": "76a23c41-cc69-4ea5-b6f7-abc0f7886adc",
  "sourceEventIdB": "1488868e-493f-4f5e-96fb-ca2697b9e45e",
  "sourceEventType": "TaskAssignedEvent",
  "realtimeDeliveries": 2,
  "deliveriesBySource": {
    "76a23c41-cc69-4ea5-b6f7-abc0f7886adc": 1,
    "1488868e-493f-4f5e-96fb-ca2697b9e45e": 1
  },
  "reconnectingObserved": true,
  "reconnectedObserved": true,
  "notificationHealthyAfterRestart": true,
  "singleActiveConnectionAtEnd": true,
  "databaseRowsForSourceEvent": 1,
  "databaseRowsForSourceEventB": 1,
  "apiRowsForSourceEvent": 1,
  "apiRowsForSourceEventB": 1,
  "noDuplicateAfterReconnect": true,
  "unreadCount": 2
}
```

## Final status

WSS realtime, reconnect, and no-duplicate evidence are accepted as PASS.
