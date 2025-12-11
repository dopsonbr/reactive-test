---
layout: home
hero:
  name: Reactive Platform
  text: AI-Native Retail Reference Architecture
  tagline: A polyglot monorepo with Spring WebFlux backend, React frontends, and full observability — designed for developers and AI agents alike.
  actions:
    - theme: brand
      text: Get Started
      link: /repo-explorer/README
    - theme: alt
      text: Browse Standards
      link: /standards/
    - theme: alt
      text: View Active Plans
      link: /plans/active/
features:
  - icon: 🏗️
    title: Multi-Service Architecture
    details: 9 reactive backend services (product, cart, checkout, orders) with shared platform libraries for logging, caching, and resilience.
    link: /repo-explorer/apps/
    linkText: Explore Services
  - icon: 🎨
    title: Modern Frontend Stack
    details: React + Vite frontends including e-commerce web, self-checkout kiosk, and merchant portal. Shared UI components with Tailwind CSS.
    link: /repo-explorer/libs/frontend/
    linkText: View Frontend Libs
  - icon: 📊
    title: Full Observability
    details: Pre-wired Grafana stack with Prometheus metrics, Loki logs, and Tempo traces. JSON structured logging throughout.
    link: /standards/backend/observability-logs
    linkText: Observability Standards
  - icon: 🤖
    title: AI-Native Development
    details: AGENTS.md files guide AI assistants through the codebase. Implementation plans document every feature's design and progress.
    link: /plans/active/
    linkText: Active Work
---

<style>
.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}
.quick-link {
  padding: 1rem 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.2s, background-color 0.2s;
}
.quick-link:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}
.quick-link h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
}
.quick-link p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
</style>

## Quick Start

```bash
# Install dependencies
corepack enable && pnpm install

# Start everything (Docker + local dev servers)
./powerstart

# Or just the docs
pnpm docs:dev
```

**URLs after startup:**
- Home Portal: http://localhost:3003
- E-commerce: http://localhost:3001
- Kiosk: http://localhost:3002
- Grafana: http://localhost:3000 (admin/admin)

## Explore the Platform

<div class="quick-links">
  <a href="/repo-explorer/README" class="quick-link">
    <h3>📖 Project README</h3>
    <p>Full project overview, build commands, and architecture</p>
  </a>
  <a href="/repo-explorer/CLAUDE" class="quick-link">
    <h3>🤖 AI Agent Guide</h3>
    <p>Instructions for AI assistants working with this codebase</p>
  </a>
  <a href="/standards/" class="quick-link">
    <h3>📐 Standards</h3>
    <p>Backend and frontend coding patterns, testing, resilience</p>
  </a>
  <a href="/ADRs/" class="quick-link">
    <h3>📝 ADRs</h3>
    <p>Architectural Decision Records explaining key choices</p>
  </a>
  <a href="/end-user-guides/" class="quick-link">
    <h3>📚 User Guides</h3>
    <p>Documentation for POS operators and kiosk users</p>
  </a>
  <a href="/repo-explorer/" class="quick-link">
    <h3>🔍 Repo Explorer</h3>
    <p>Browse all README and AGENTS files from the codebase</p>
  </a>
</div>

## Service Overview

| Service | Port | Description |
|---------|------|-------------|
| product-service | 8090 | Product aggregation from merchandise, price, inventory |
| cart-service | 8081 | Shopping cart management |
| checkout-service | 8087 | Order checkout and payment processing |
| order-service | 8088 | Order viewing and management |
| user-service | 8089 | User management and JWT tokens |
| customer-service | 8083 | Customer profiles |
| discount-service | 8084 | Discounts and promos |
| fulfillment-service | 8085 | Fulfillment orchestration |
| audit-service | 8086 | Audit event processing |
