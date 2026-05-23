# Gateway

YARP reverse proxy entry point for routing requests to backend services.

Routes:

- `/identity/{**catch-all}` to Identity service
- `/manga/{**catch-all}` to Manga Management service
- `/editorial/{**catch-all}` to Editorial service
- `/files/{**catch-all}` to File service
