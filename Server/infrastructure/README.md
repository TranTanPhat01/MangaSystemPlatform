# Infrastructure

Run local infrastructure:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

Reset volumes:

```bash
docker compose down -v
```

Services:

- PostgreSQL: `localhost:5432`, user `postgres`, password `12345`
- RabbitMQ dashboard: `http://localhost:15672`, user `guest`, password `guest`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`, user `admin`, password `password123`
