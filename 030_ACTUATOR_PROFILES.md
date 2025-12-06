# 030_ACTUATOR_PROFILES

**Status: DRAFT**

---

## Overview

Configure all backend services with two actuator modes: a **default development mode** exposing all actuator endpoints without authentication (safe for local development), and a **production profile** that restricts endpoints to only those required for Kubernetes orchestration (health, readiness, liveness, metrics, prometheus).

**Rationale:** All development happens locally where actuator endpoints pose no security risk. Exposing all endpoints by default (env, beans, mappings, configprops, etc.) dramatically improves developer productivity and debugging. Production deployments activate the restricted profile via `SPRING_PROFILES_ACTIVE=prod`.

## Goals

1. Expose all actuator endpoints without auth in default (dev) mode
2. Create production profile restricting actuator to k8s-required endpoints only
3. Standardize actuator configuration across all 7 backend services
4. Maintain existing health checks for Docker Compose compatibility

## References

**Standards:**
- `docs/standards/backend/security.md` - Security configuration patterns

---

## Architecture

### Profile Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    application.yml (default)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ management.endpoints.web.exposure.include: "*"          ││
│  │ management.endpoint.health.show-details: always         ││
│  │ app.security.enabled: false                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SPRING_PROFILES_ACTIVE=prod
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   application-prod.yml                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ management.endpoints.web.exposure.include:              ││
│  │   health,info,metrics,prometheus,readiness,liveness     ││
│  │ management.endpoint.health.show-details: when_authorized││
│  │ app.security.enabled: true                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Endpoints by Mode

| Endpoint | Dev (default) | Prod |
|----------|---------------|------|
| `/actuator/health` | ✅ | ✅ |
| `/actuator/health/readiness` | ✅ | ✅ |
| `/actuator/health/liveness` | ✅ | ✅ |
| `/actuator/info` | ✅ | ✅ |
| `/actuator/metrics` | ✅ | ✅ |
| `/actuator/prometheus` | ✅ | ✅ |
| `/actuator/env` | ✅ | ❌ |
| `/actuator/beans` | ✅ | ❌ |
| `/actuator/mappings` | ✅ | ❌ |
| `/actuator/configprops` | ✅ | ❌ |
| `/actuator/loggers` | ✅ | ❌ |
| `/actuator/threaddump` | ✅ | ❌ |
| `/actuator/heapdump` | ✅ | ❌ |
| `/actuator/circuitbreakers` | ✅ | ❌ |
| `/actuator/retries` | ✅ | ❌ |

### Dependency Order

```
Phase 1: Platform Config
        │
        ▼
Phase 2: Service Updates (all 7 in parallel)
        │
        ▼
Phase 3: Docker/Documentation
```

---

## Phase 1: Platform Actuator Configuration

**Prereqs:** None
**Blockers:** None

### 1.1 Create Platform Actuator Properties

**Files:**
- CREATE: `libs/platform/platform-security/src/main/java/org/example/platform/security/ActuatorProperties.java`

**Implementation:**
```java
@ConfigurationProperties(prefix = "app.actuator")
public record ActuatorProperties(
    boolean exposeAll,  // default: true (dev mode)
    boolean requireAuth // default: false (dev mode)
) {
    public ActuatorProperties {
        if (exposeAll == null) exposeAll = true;
        if (requireAuth == null) requireAuth = false;
    }
}
```

### 1.2 Create Shared Production Profile Template

**Files:**
- CREATE: `libs/platform/platform-security/src/main/resources/actuator-prod-defaults.yml`

**Implementation:**
Reference configuration that services can import:
```yaml
# Production actuator defaults - import in application-prod.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
      group:
        readiness:
          include: readinessState,db,redis
        liveness:
          include: livenessState

app:
  security:
    enabled: true
  actuator:
    expose-all: false
    require-auth: true
```

---

## Phase 2: Update All Backend Services

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Update Product Service

**Files:**
- MODIFY: `apps/product-service/src/main/resources/application.yml`
- CREATE: `apps/product-service/src/main/resources/application-prod.yml`
- MODIFY: `apps/product-service/src/main/java/org/example/product/security/SecurityConfig.java`

**application.yml changes:**
```yaml
# Default: expose ALL actuator endpoints (dev mode)
management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true

app:
  security:
    enabled: false  # Dev mode: no auth required
```

**application-prod.yml:**
```yaml
# Production: minimal actuator for k8s
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized

app:
  security:
    enabled: true
```

**SecurityConfig changes:**
- Remove actuator-specific path matchers (all handled by exposure config)
- In prod mode, only exposed endpoints are accessible anyway

### 2.2 Update Cart Service

**Files:**
- MODIFY: `apps/cart-service/src/main/resources/application.yml`
- CREATE: `apps/cart-service/src/main/resources/application-prod.yml`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/config/SecurityConfig.java`

**Same pattern as 2.1**

### 2.3 Update Customer Service

**Files:**
- MODIFY: `apps/customer-service/src/main/resources/application.yml`
- CREATE: `apps/customer-service/src/main/resources/application-prod.yml`
- MODIFY: `apps/customer-service/src/main/java/org/example/customer/security/SecurityConfig.java`

**Same pattern as 2.1**

### 2.4 Update Discount Service

**Files:**
- MODIFY: `apps/discount-service/src/main/resources/application.yml`
- CREATE: `apps/discount-service/src/main/resources/application-prod.yml`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/config/SecurityConfig.java` (if missing)

**Same pattern as 2.1**

### 2.5 Update Fulfillment Service

**Files:**
- MODIFY: `apps/fulfillment-service/src/main/resources/application.yml`
- CREATE: `apps/fulfillment-service/src/main/resources/application-prod.yml`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/config/SecurityConfig.java` (if missing)

**Same pattern as 2.1**

### 2.6 Update Audit Service

**Files:**
- MODIFY: `apps/audit-service/src/main/resources/application.yml`
- CREATE: `apps/audit-service/src/main/resources/application-prod.yml`

**Same pattern as 2.1** (audit service has inline docker profile - preserve that)

### 2.7 Update Checkout Service

**Files:**
- MODIFY: `apps/checkout-service/src/main/resources/application.yml`
- CREATE: `apps/checkout-service/src/main/resources/application-prod.yml`
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/config/SecurityConfig.java`

**Same pattern as 2.1**

---

## Phase 3: Docker and Documentation Updates

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Update Docker Compose (Optional)

**Files:**
- MODIFY: `docker/docker-compose.yml` (optional - add comment explaining dev mode)

**Implementation:**
Add comment explaining that services run in dev mode by default:
```yaml
# Backend services run in dev mode (all actuator endpoints exposed)
# For production-like testing, add: SPRING_PROFILES_ACTIVE=prod
```

### 3.2 Verify Health Checks Still Work

**Implementation:**
```bash
cd docker && docker compose up -d
curl http://localhost:8080/actuator/health  # product-service
curl http://localhost:8081/actuator/health  # cart-service
# etc.

# Verify all endpoints accessible in dev mode
curl http://localhost:8080/actuator/env
curl http://localhost:8080/actuator/beans
curl http://localhost:8080/actuator/mappings
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/platform/platform-security/.../ActuatorProperties.java` | Centralized actuator config |
| CREATE | `libs/platform/platform-security/.../actuator-prod-defaults.yml` | Shared prod config |
| MODIFY | `apps/*/src/main/resources/application.yml` (7 files) | Enable all actuator in dev |
| CREATE | `apps/*/src/main/resources/application-prod.yml` (7 files) | Restrict actuator in prod |
| MODIFY | `apps/*/src/main/java/.../SecurityConfig.java` (4 files) | Simplify actuator security |
| CREATE | `apps/{discount,fulfillment}-service/.../SecurityConfig.java` (2 files) | Add missing security config |
| MODIFY | `docker/docker-compose.yml` | Add dev mode comment |

---

## Testing Strategy

### Dev Mode (Default)
```bash
# Start service without profile
./gradlew :apps:product-service:bootRun

# All endpoints accessible
curl http://localhost:8080/actuator          # List all endpoints
curl http://localhost:8080/actuator/env      # Environment variables
curl http://localhost:8080/actuator/beans    # Spring beans
curl http://localhost:8080/actuator/mappings # Request mappings
```

### Prod Mode
```bash
# Start service with prod profile
SPRING_PROFILES_ACTIVE=prod ./gradlew :apps:product-service:bootRun

# Only k8s endpoints accessible
curl http://localhost:8080/actuator/health    # 200 OK
curl http://localhost:8080/actuator/env       # 404 Not Found
```

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add section on actuator profiles (dev vs prod) |
| `apps/README.md` | Document actuator profile usage |
| `docs/standards/backend/security.md` | Add actuator security patterns |

---

## Checklist

- [ ] Phase 1: Platform actuator config created
- [ ] Phase 2: All 7 services updated with dev defaults
- [ ] Phase 2: All 7 services have application-prod.yml
- [ ] Phase 3: Docker health checks verified
- [ ] All actuator endpoints accessible in dev mode
- [ ] Only k8s endpoints accessible in prod mode
- [ ] Documentation updated
