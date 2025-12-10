# 050E: Docker Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create Dockerfiles for the new services and integrate them into docker-compose.yml.

**Architecture:** Follow existing Dockerfile patterns with OpenTelemetry agent and health checks.

**Tech Stack:** Docker, Eclipse Temurin JRE 25, OpenTelemetry

---

## Task 1: Create Dockerfile for Merchandise Service

**Files:**
- Create: `docker/Dockerfile.merchandise-service`

**Step 1: Create the Dockerfile**

```dockerfile
FROM eclipse-temurin:25-jre

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Download OpenTelemetry Java agent
ARG OTEL_VERSION=2.10.0
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_VERSION}/opentelemetry-javaagent.jar /app/otel-agent.jar
RUN chmod 644 /app/otel-agent.jar

# Copy pre-built JAR
COPY apps/merchandise-service/build/libs/*.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

USER appuser

# OpenTelemetry configuration
ENV JAVA_TOOL_OPTIONS="-javaagent:/app/otel-agent.jar"
ENV OTEL_SERVICE_NAME=merchandise-service
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_METRICS_EXPORTER=none
ENV OTEL_LOGS_EXPORTER=none
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc

EXPOSE 8091

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8091/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Step 2: Commit**

```bash
git add docker/Dockerfile.merchandise-service
git commit -m "feat(docker): add Dockerfile for merchandise-service"
```

---

## Task 2: Create Dockerfile for Price Service

**Files:**
- Create: `docker/Dockerfile.price-service`

**Step 1: Create the Dockerfile**

```dockerfile
FROM eclipse-temurin:25-jre

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

ARG OTEL_VERSION=2.10.0
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_VERSION}/opentelemetry-javaagent.jar /app/otel-agent.jar
RUN chmod 644 /app/otel-agent.jar

COPY apps/price-service/build/libs/*.jar app.jar

RUN mkdir -p /app/logs && chown -R appuser:appuser /app

USER appuser

ENV JAVA_TOOL_OPTIONS="-javaagent:/app/otel-agent.jar"
ENV OTEL_SERVICE_NAME=price-service
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_METRICS_EXPORTER=none
ENV OTEL_LOGS_EXPORTER=none
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc

EXPOSE 8092

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8092/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Step 2: Commit**

```bash
git add docker/Dockerfile.price-service
git commit -m "feat(docker): add Dockerfile for price-service"
```

---

## Task 3: Create Dockerfile for Inventory Service

**Files:**
- Create: `docker/Dockerfile.inventory-service`

**Step 1: Create the Dockerfile**

```dockerfile
FROM eclipse-temurin:25-jre

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

ARG OTEL_VERSION=2.10.0
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_VERSION}/opentelemetry-javaagent.jar /app/otel-agent.jar
RUN chmod 644 /app/otel-agent.jar

COPY apps/inventory-service/build/libs/*.jar app.jar

RUN mkdir -p /app/logs && chown -R appuser:appuser /app

USER appuser

ENV JAVA_TOOL_OPTIONS="-javaagent:/app/otel-agent.jar"
ENV OTEL_SERVICE_NAME=inventory-service
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_METRICS_EXPORTER=none
ENV OTEL_LOGS_EXPORTER=none
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc

EXPOSE 8093

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8093/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Step 2: Commit**

```bash
git add docker/Dockerfile.inventory-service
git commit -m "feat(docker): add Dockerfile for inventory-service"
```

---

## Task 4: Add Services to docker-compose.yml

**Files:**
- Modify: `docker/docker-compose.yml`

**Step 1: Add merchandise-service after user-service**

```yaml
  merchandise-service:
    build:
      context: ..
      dockerfile: docker/Dockerfile.merchandise-service
    container_name: merchandise-service
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/merchandisedb
      - SPRING_R2DBC_USERNAME=merchandise_user
      - SPRING_R2DBC_PASSWORD=merchandise_pass
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/merchandisedb
      - SPRING_DATASOURCE_USERNAME=merchandise_user
      - SPRING_DATASOURCE_PASSWORD=merchandise_pass
      - SPRING_FLYWAY_URL=jdbc:postgresql://postgres:5432/merchandisedb
      - SPRING_FLYWAY_USER=merchandise_user
      - SPRING_FLYWAY_PASSWORD=merchandise_pass
      - OTEL_SERVICE_NAME=merchandise-service
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
      - OTEL_EXPORTER_OTLP_PROTOCOL=grpc
      - OTEL_TRACES_EXPORTER=otlp
      - OTEL_METRICS_EXPORTER=none
      - OTEL_LOGS_EXPORTER=none
      - OTEL_PROPAGATORS=tracecontext,baggage
    volumes:
      - app-logs:/app/logs
    ports:
      - "8091:8091"
    depends_on:
      postgres:
        condition: service_healthy
      tempo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8091/actuator/health"]
      interval: 10s
      timeout: 5s
      start_period: 60s
      retries: 5
    networks:
      - observability
```

**Step 2: Add price-service**

```yaml
  price-service:
    build:
      context: ..
      dockerfile: docker/Dockerfile.price-service
    container_name: price-service
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/pricedb
      - SPRING_R2DBC_USERNAME=price_user
      - SPRING_R2DBC_PASSWORD=price_pass
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/pricedb
      - SPRING_DATASOURCE_USERNAME=price_user
      - SPRING_DATASOURCE_PASSWORD=price_pass
      - SPRING_FLYWAY_URL=jdbc:postgresql://postgres:5432/pricedb
      - SPRING_FLYWAY_USER=price_user
      - SPRING_FLYWAY_PASSWORD=price_pass
      - OTEL_SERVICE_NAME=price-service
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
      - OTEL_EXPORTER_OTLP_PROTOCOL=grpc
      - OTEL_TRACES_EXPORTER=otlp
      - OTEL_METRICS_EXPORTER=none
      - OTEL_LOGS_EXPORTER=none
      - OTEL_PROPAGATORS=tracecontext,baggage
    volumes:
      - app-logs:/app/logs
    ports:
      - "8092:8092"
    depends_on:
      postgres:
        condition: service_healthy
      tempo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8092/actuator/health"]
      interval: 10s
      timeout: 5s
      start_period: 60s
      retries: 5
    networks:
      - observability
```

**Step 3: Add inventory-service**

```yaml
  inventory-service:
    build:
      context: ..
      dockerfile: docker/Dockerfile.inventory-service
    container_name: inventory-service
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/inventorydb
      - SPRING_R2DBC_USERNAME=inventory_user
      - SPRING_R2DBC_PASSWORD=inventory_pass
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/inventorydb
      - SPRING_DATASOURCE_USERNAME=inventory_user
      - SPRING_DATASOURCE_PASSWORD=inventory_pass
      - SPRING_FLYWAY_URL=jdbc:postgresql://postgres:5432/inventorydb
      - SPRING_FLYWAY_USER=inventory_user
      - SPRING_FLYWAY_PASSWORD=inventory_pass
      - OTEL_SERVICE_NAME=inventory-service
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
      - OTEL_EXPORTER_OTLP_PROTOCOL=grpc
      - OTEL_TRACES_EXPORTER=otlp
      - OTEL_METRICS_EXPORTER=none
      - OTEL_LOGS_EXPORTER=none
      - OTEL_PROPAGATORS=tracecontext,baggage
    volumes:
      - app-logs:/app/logs
    ports:
      - "8093:8093"
    depends_on:
      postgres:
        condition: service_healthy
      tempo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8093/actuator/health"]
      interval: 10s
      timeout: 5s
      start_period: 60s
      retries: 5
    networks:
      - observability
```

**Step 4: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "feat(docker): add merchandise, price, inventory services to compose"
```

---

## Task 5: Update Product Service Dependencies

**Files:**
- Modify: `docker/docker-compose.yml` (product-service section)

**Step 1: Update product-service depends_on to include new services**

Find the product-service section and update depends_on:

```yaml
  product-service:
    # ... existing configuration ...
    depends_on:
      wiremock:
        condition: service_healthy
      tempo:
        condition: service_healthy
      redis:
        condition: service_healthy
      merchandise-service:
        condition: service_healthy
      price-service:
        condition: service_healthy
      inventory-service:
        condition: service_healthy
```

**Step 2: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "feat(docker): add product-service dependencies on data services"
```

---

## Task 6: Update Product Service Configuration

**Files:**
- Modify: `apps/product-service/src/main/resources/application.yml`
- Modify: `apps/product-service/src/main/resources/application-docker.yml`

**Step 1: Update local development configuration**

In `application.yml`, update the services URLs:

```yaml
services:
  merchandise:
    base-url: ${MERCHANDISE_SERVICE_URL:http://localhost:8091}
  price:
    base-url: ${PRICE_SERVICE_URL:http://localhost:8092}
  inventory:
    base-url: ${INVENTORY_SERVICE_URL:http://localhost:8093}
  catalog:
    base-url: ${CATALOG_SERVICE_URL:http://localhost:8082}
```

**Step 2: Update Docker profile configuration**

In `application-docker.yml`, add:

```yaml
services:
  merchandise:
    base-url: http://merchandise-service:8091
  price:
    base-url: http://price-service:8092
  inventory:
    base-url: http://inventory-service:8093
  catalog:
    base-url: http://wiremock:8080
```

**Step 3: Commit**

```bash
git add apps/product-service/src/main/resources/application.yml
git add apps/product-service/src/main/resources/application-docker.yml
git commit -m "feat(product-service): configure URLs for real data services"
```

---

## Task 7: Build and Test

**Step 1: Build all new services**

```bash
./gradlew :apps:merchandise-service:bootJar \
          :apps:price-service:bootJar \
          :apps:inventory-service:bootJar
```

Expected: BUILD SUCCESSFUL

**Step 2: Start the full stack**

```bash
cd docker
docker compose down -v
docker compose up -d --build postgres
sleep 15  # Wait for postgres to initialize databases
docker compose up -d --build merchandise-service price-service inventory-service
sleep 30  # Wait for services to start
docker compose up -d --build product-service
```

**Step 3: Verify services are healthy**

```bash
curl http://localhost:8091/actuator/health
curl http://localhost:8092/actuator/health
curl http://localhost:8093/actuator/health
curl http://localhost:8090/actuator/health
```

Expected: All return `{"status":"UP"}`

**Step 4: Test end-to-end**

```bash
# Create a test product in merchandise
curl -X POST http://localhost:8091/merchandise \
  -H "Content-Type: application/json" \
  -d '{"sku": 9999, "name": "Test Product", "description": "Test", "category": "Test", "suggestedRetailPrice": 99.99}'

# Set price
curl -X PUT http://localhost:8092/price/9999 \
  -H "Content-Type: application/json" \
  -d '{"price": 79.99, "originalPrice": 99.99}'

# Set inventory
curl -X PUT http://localhost:8093/inventory/9999 \
  -H "Content-Type: application/json" \
  -d '{"availableQuantity": 100}'

# Fetch via product-service
curl http://localhost:8090/products/9999
```

Expected: Product aggregated from all three services

**Step 5: Commit any fixes**

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | `Dockerfile.merchandise-service` | Merchandise Docker image |
| 2 | `Dockerfile.price-service` | Price Docker image |
| 3 | `Dockerfile.inventory-service` | Inventory Docker image |
| 4 | `docker-compose.yml` | Add new services |
| 5 | `docker-compose.yml` | Update product-service deps |
| 6 | `application*.yml` | Product-service URLs |
| 7 | - | Build and test |
