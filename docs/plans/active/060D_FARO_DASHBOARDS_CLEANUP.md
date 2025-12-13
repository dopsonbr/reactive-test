# 060D: Faro Dashboards & Cleanup

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Parent Plan:** [060_FRONTEND_OBSERVABILITY_FARO.md](060_FRONTEND_OBSERVABILITY_FARO.md)

**Prerequisite:** [060C_FARO_APP_INTEGRATION.md](060C_FARO_APP_INTEGRATION.md)

**Goal:** Create Grafana dashboards for frontend observability and clean up redundant code.

---

## Task 1: Create Frontend Health Dashboard

**Files:**
- Create: `docker/grafana/provisioning/dashboards/frontend-health.json`

**Step 1: Create dashboard JSON**

Create a dashboard with the following panels:

1. **Error Rate by App** (Loki)
   - Query: `sum by (app) (count_over_time({job="faro"} | json | level="error" [$__interval]))`

2. **Web Vitals Gauges** (Prometheus)
   - LCP gauge with thresholds (good < 2.5s, needs improvement < 4s, poor >= 4s)
   - INP gauge with thresholds (good < 200ms, needs improvement < 500ms, poor >= 500ms)
   - CLS gauge with thresholds (good < 0.1, needs improvement < 0.25, poor >= 0.25)

3. **Active Sessions by App** (Prometheus)
   - Query: `sum by (app) (faro_session_active)`

4. **Top Errors Table** (Loki)
   - Query: `{job="faro"} | json | level="error" | line_format "{{.message}}"`
   - Group by error message, show count

5. **Slowest Pages by Route** (Tempo)
   - Query for frontend spans grouped by route

**Step 2: Add dashboard to provisioning**

Ensure `docker/grafana/provisioning/dashboards/dashboards.yml` includes the new dashboard directory.

**Step 3: Commit**

```bash
git add docker/grafana/provisioning/dashboards/frontend-health.json
git commit -m "feat(grafana): add frontend health dashboard"
```

---

## Task 2: Create User Journey Dashboard

**Files:**
- Create: `docker/grafana/provisioning/dashboards/user-journey.json`

**Step 1: Create dashboard JSON**

Create a dashboard with the following panels:

1. **Session Timeline** (Loki)
   - Variable: `$session_id`
   - Query: `{job="faro"} | json | session_id="$session_id" | line_format "{{.timestamp}} [{{.level}}] {{.message}}"`

2. **Distributed Trace View** (Tempo)
   - Link to Tempo explore with trace ID from selected session

3. **Checkout Funnel** (Loki)
   - Stages: cart:view → checkout:start → checkout:step → checkout:complete
   - Query for each stage and calculate conversion rates

4. **Error Context** (Loki)
   - Show errors with surrounding events (±5 events)
   - Filter by session_id

**Step 2: Commit**

```bash
git add docker/grafana/provisioning/dashboards/user-journey.json
git commit -m "feat(grafana): add user journey dashboard"
```

---

## Task 3: Migrate Existing Logger

**Files:**
- Modify: `apps/ecommerce-web/src/shared/utils/logger.ts`

**Step 1: Re-export from shared lib**

Replace the existing logger implementation with a re-export:

```typescript
// apps/ecommerce-web/src/shared/utils/logger.ts
// Re-export from shared library for backwards compatibility
export { logger } from '@reactive-platform/shared-observability/faro';
```

**Step 2: Verify no breaking changes**

Run: `pnpm nx build ecommerce-web`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/ecommerce-web/src/shared/utils/logger.ts
git commit -m "refactor(ecommerce-web): migrate logger to shared Faro lib"
```

---

## Task 4: Remove Redundant Vitals

**Files:**
- Delete: `apps/ecommerce-web/src/shared/utils/vitals.ts`
- Modify: any files importing vitals.ts

**Step 1: Check for imports of vitals.ts**

Run: `grep -r "from.*vitals" apps/ecommerce-web/src/`

**Step 2: Remove vitals.ts and update imports**

Faro automatically captures Web Vitals, so manual initialization is no longer needed.

- Remove any `reportWebVitals()` calls from entry points
- Delete the vitals.ts file

**Step 3: Verify build**

Run: `pnpm nx build ecommerce-web`
Expected: Build succeeds

**Step 4: Commit**

```bash
git rm apps/ecommerce-web/src/shared/utils/vitals.ts
git add -u
git commit -m "refactor(ecommerce-web): remove vitals.ts (Faro handles Web Vitals)"
```

---

## Verification

### Final Integration Test

**Step 1: Start full stack**

```bash
docker compose -f docker/docker-compose.yml up -d
```

**Step 2: Open ecommerce-web and trigger events**

1. Open http://localhost:3001
2. Browse products
3. Add item to cart
4. Start checkout

**Step 3: Verify in Grafana**

1. Open http://localhost:3000 (admin/admin)
2. Go to Explore → Loki
3. Query: `{app="ecommerce-web"}`
4. Should see logs from frontend

**Step 4: Verify traces**

1. Go to Explore → Tempo
2. Search for traces with `service.name = "ecommerce-web"`
3. Should see frontend spans linked to backend

**Step 5: Check dashboards**

1. Go to Dashboards
2. Open "Frontend Health"
3. Verify panels are populated

---

## Summary

| Task | Files | Commit |
|------|-------|--------|
| 1 | frontend-health.json | frontend health dashboard |
| 2 | user-journey.json | user journey dashboard |
| 3 | logger.ts | migrate to shared lib |
| 4 | vitals.ts (delete) | remove redundant vitals |

---

## Success Criteria (from Parent Plan)

After completing all sub-plans, verify:

- [x] Alloy running in Docker stack with Faro receiver (060A)
- [ ] All 4 frontend apps sending telemetry (060C)
- [ ] Errors visible in Grafana/Loki with stack traces (060D verification)
- [ ] Web Vitals metrics in Prometheus (060B + 060D verification)
- [ ] Distributed traces show frontend → backend correlation (060D verification)
- [ ] User actions tracked for key flows (060C)
- [ ] Two dashboards provisioned and functional (060D)
