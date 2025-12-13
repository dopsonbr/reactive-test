# 060: Frontend Observability with Grafana Faro

## Summary

Implement Real User Monitoring (RUM) across all frontend applications (except offline-pos) using Grafana Faro. Frontend telemetry flows through Grafana Alloy to the existing observability stack (Loki, Tempo, Prometheus).

## Goals

- **Error visibility** - Frontend errors in Grafana alongside backend logs
- **Performance monitoring** - Core Web Vitals tracking with alerting thresholds
- **Full-stack tracing** - Frontend user actions → API calls → backend services in single trace
- **Session tracking** - Correlate all telemetry by user session

## Scope

### In Scope
- ecommerce-web
- merchant-portal
- pos-web
- kiosk-web

### Out of Scope
- offline-pos (Go app, different architecture)
- Session replay (not available self-hosted)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ ecommerce-web│  │merchant-portal│  │   pos-web   │  │  kiosk-web   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │          │
│         └────────────┬────┴────────┬────────┴────────┬────────┘          │
│                      │  @grafana/faro-react          │                   │
│                      │  (errors, logs, vitals,       │                   │
│                      │   traces, user actions)       │                   │
└──────────────────────┼───────────────────────────────┼───────────────────┘
                       │                               │
                       ▼                               ▼
              ┌────────────────┐              ┌────────────────┐
              │  Alloy :12347  │              │ Backend APIs   │
              │  (faro.receiver)│              │ (traceparent)  │
              └───────┬────────┘              └────────┬───────┘
                      │                                │
        ┌─────────────┼─────────────┐                  │
        ▼             ▼             ▼                  ▼
   ┌─────────┐  ┌──────────┐  ┌───────────┐     ┌──────────┐
   │  Loki   │  │Prometheus│  │   Tempo   │◄────│  Tempo   │
   │ (logs)  │  │(metrics) │  │ (traces)  │     │  (OTLP)  │
   └─────────┘  └──────────┘  └───────────┘     └──────────┘
                      │
                      ▼
              ┌────────────────┐
              │    Grafana     │
              │  (dashboards)  │
              └────────────────┘
```

## Key User Flows to Instrument

| App | Actions |
|-----|---------|
| ecommerce-web | add-to-cart, checkout-start, checkout-complete, search, login/logout |
| pos-web | scan-item, void-item, tender-start, tender-complete, transaction-void |
| kiosk-web | scan-item, add-to-cart, checkout-start, payment-complete |
| merchant-portal | product-create, product-update, inventory-adjust, price-update |

## Dependencies

### NPM Packages
- `@grafana/faro-react`
- `@grafana/faro-web-sdk`
- `@grafana/faro-web-tracing`

### Docker Images
- `grafana/alloy:v1.5.1`

## Success Criteria

- [ ] Alloy running in Docker stack with Faro receiver
- [ ] All 4 frontend apps sending telemetry
- [ ] Errors visible in Grafana/Loki with stack traces
- [ ] Web Vitals metrics in Prometheus
- [ ] Distributed traces show frontend → backend correlation
- [ ] User actions tracked for key flows
- [ ] Two dashboards provisioned and functional

## Sub-Plans

| Plan | Phase | Description |
|------|-------|-------------|
| [060A](060A_FARO_INFRASTRUCTURE.md) | Infrastructure | Alloy config, Docker compose, verification |
| [060B](060B_FARO_SHARED_LIBRARY.md) | Shared Library | Faro library scaffold, initFaro, logger, userActions |
| [060C](060C_FARO_APP_INTEGRATION.md) | App Integration | Integrate 4 apps, nginx configs, instrument flows |
| [060D](060D_FARO_DASHBOARDS_CLEANUP.md) | Dashboards & Cleanup | Grafana dashboards, migrate logger, remove vitals |

## References

- [Grafana Faro OSS](https://grafana.com/oss/faro/)
- [Faro Web SDK GitHub](https://github.com/grafana/faro-web-sdk)
- [Faro React Quickstart](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/quickstart/react/)
- [Alloy Faro Receiver](https://grafana.com/docs/alloy/latest/reference/components/faro.receiver/)
- Existing: `docs/standards/frontend/observability.md`
