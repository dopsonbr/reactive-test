# Offline POS - Docker Guide

This guide explains how to build and run the Offline POS application using Docker.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down

# Stop and remove volumes (clears database)
docker compose down -v
```

The application will be available at http://localhost:3000

### Using Docker CLI

```bash
# Build the image
docker build -t offline-pos:latest .

# Run the container
docker run -d \
  --name offline-pos \
  -p 3000:3000 \
  -v offline-pos-data:/data \
  -e PORT=3000 \
  -e DB_PATH=/data/offline-pos.db \
  -e CENTRAL_URL=http://localhost:8080 \
  offline-pos:latest

# View logs
docker logs -f offline-pos

# Stop the container
docker stop offline-pos

# Remove the container
docker rm offline-pos
```

## Image Details

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimal image size:

1. **Build Stage** (`golang:1.22-alpine`)
   - Copies dependencies and downloads modules
   - Builds a static binary with CGO_ENABLED=0
   - Uses `-ldflags="-s -w"` to strip debug info and reduce size
   - Uses `-trimpath` for reproducible builds

2. **Runtime Stage** (`alpine:latest`)
   - Minimal Alpine Linux base (~5MB)
   - Includes only runtime dependencies (ca-certificates, tzdata, wget)
   - Runs as non-root user (appuser)
   - Final image size: ~25-30MB

### Security Features

- **Non-root user**: Application runs as user `appuser` (UID 1000)
- **Read-only filesystem**: Binary is immutable
- **Minimal attack surface**: Only essential runtime dependencies
- **Health checks**: Built-in health monitoring using `/api/status` endpoint

## Configuration

### Environment Variables

| Variable      | Default                 | Description                           |
|---------------|-------------------------|---------------------------------------|
| `PORT`        | `3000`                  | HTTP server port                      |
| `DB_PATH`     | `/data/offline-pos.db`  | SQLite database file path             |
| `CENTRAL_URL` | `http://localhost:8080` | Central server URL for synchronization|

### Volumes

- `/data` - Persistent storage for SQLite database

**Important**: Always mount `/data` as a volume to persist transactions between container restarts.

## Health Checks

The Docker image includes a health check that monitors the `/api/status` endpoint:

- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Start period**: 5 seconds
- **Retries**: 3

Check health status:

```bash
docker inspect --format='{{.State.Health.Status}}' offline-pos
```

## Building for Production

### Optimize Build Cache

The Dockerfile is optimized for layer caching:

```bash
# Dependencies are cached separately from source code
# Only rebuilds when go.mod or go.sum changes
docker build -t offline-pos:v1.0.0 .
```

### Multi-Platform Builds

To build for multiple architectures:

```bash
# Enable buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t offline-pos:v1.0.0 \
  --push \
  .
```

### Size Optimization

Current image size breakdown:

- Alpine base: ~5MB
- Go binary (stripped): ~15-20MB
- Dependencies (ca-certs, tzdata, wget): ~3-5MB
- **Total: ~25-30MB**

To further reduce size, consider:
- Using `scratch` base (requires removing health check)
- Using UPX compression on the binary
- Removing wget if health checks aren't needed

## Development

### Local Development with Hot Reload

For development, use Air for hot reload instead of Docker:

```bash
# Install Air
go install github.com/cosmtrek/air@latest

# Run with hot reload
air
```

### Debugging in Docker

To debug inside the container:

```bash
# Run with interactive shell
docker run -it --rm \
  --entrypoint /bin/sh \
  offline-pos:latest

# Or exec into running container
docker exec -it offline-pos /bin/sh
```

## Troubleshooting

### Container won't start

Check logs:

```bash
docker logs offline-pos
```

Common issues:
- Port 3000 already in use: Change `-p` mapping
- Permission denied on /data: Check volume permissions
- Database locked: Ensure no other instances are running

### Health check failing

Verify the `/api/status` endpoint manually:

```bash
docker exec offline-pos wget -O- http://localhost:3000/api/status
```

### Database persistence issues

Ensure the volume is mounted:

```bash
docker volume inspect offline-pos-data
```

## Production Deployment

### Recommended docker-compose.yml for Production

```yaml
version: '3.8'

services:
  offline-pos:
    image: offline-pos:v1.0.0
    container_name: offline-pos
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DB_PATH=/data/offline-pos.db
      - CENTRAL_URL=https://central-api.example.com
    volumes:
      - offline-pos-data:/data
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/status"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3

volumes:
  offline-pos-data:
    driver: local
```

### Monitoring

Integrate with monitoring tools:

```bash
# Prometheus metrics endpoint (if implemented)
curl http://localhost:3000/metrics

# Docker stats
docker stats offline-pos
```

## License

See parent project LICENSE file.
