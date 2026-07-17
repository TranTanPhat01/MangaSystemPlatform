# Gateway

YARP reverse proxy entry point for routing requests to backend services.

Routes:

- `/identity/{**catch-all}` to Identity service
- `/manga/{**catch-all}` to Manga Management service
- `/editorial/{**catch-all}` to Editorial service
- `/files/{**catch-all}` to File service
- `/notifications/{**catch-all}` to Notification service, including SignalR `/notifications/hub`

The base configuration targets Docker service names. `appsettings.Development.json` overrides
destinations to the local service ports. Authorization headers are forwarded by YARP; each
downstream service validates its own JWT.
