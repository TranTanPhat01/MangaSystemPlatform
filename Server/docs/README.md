# Tai lieu Server

Thu muc nay tong hop cac tai lieu tieng Viet cho backend MangaSystemPlatform.

## Danh sach tai lieu

- [Tong quan Backend](./backend-overview.md)
- [Nhat ky trien khai cac phase](./phase-implementation-log.md)
- [Huong dan chay local va kiem thu](./local-runbook.md)

## Trang thai hien tai

Backend da co skeleton microservice .NET 8 theo Clean Architecture, Gateway YARP, cac service Identity, Manga Management, File, Editorial, AI skeleton, infrastructure local bang Docker Compose, va event bus RabbitMQ co abstraction dung chung.

Chua containerize cac .NET API service trong phase hien tai. Docker Compose chi dung cho infrastructure: PostgreSQL, RabbitMQ, Redis va MinIO.
