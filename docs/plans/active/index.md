# Active Implementation Plans

Current work in progress. Each plan documents the design, phases, and checklist for a feature or improvement.

<style>
.plan-grid {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}
.plan-card {
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.plan-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.plan-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}
.plan-card h3 a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.plan-card p {
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.5;
}
.plan-card .tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.plan-card .tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}
.plan-card .tag.initiative {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
</style>

## Major Initiatives

<div class="plan-grid">

<div class="plan-card">
  <h3><a href="./050_MERCHANT_PORTAL_AND_DATA_SERVICES">050: Merchant Portal & Data Services</a></h3>
  <p>Build real backend services for merchandise, pricing, and inventory data that replace WireMock stubs. Includes merchant portal with role-based access for different specialists.</p>
  <div class="tags">
    <span class="tag initiative">Initiative (6 sub-plans)</span>
    <span class="tag">Backend</span>
    <span class="tag">Frontend</span>
    <span class="tag">PostgreSQL</span>
  </div>
</div>

<div class="plan-card">
  <h3><a href="./048_OFFLINE_POS">048: Offline POS</a></h3>
  <p>Disaster recovery point-of-sale system running as a single Go binary with SQLite storage and vanilla JavaScript frontend. Captures sales offline and syncs when connectivity returns.</p>
  <div class="tags">
    <span class="tag initiative">Initiative (5 sub-plans)</span>
    <span class="tag">Go</span>
    <span class="tag">SQLite</span>
    <span class="tag">Vanilla JS</span>
  </div>
</div>

<div class="plan-card">
  <h3><a href="./045_POS_SYSTEM">045: POS System</a></h3>
  <p>Comprehensive Point of Sale web application for in-store employees, contact center agents, and B2B sales representatives. Supports full spectrum of retail transactions.</p>
  <div class="tags">
    <span class="tag initiative">Initiative (7 sub-plans)</span>
    <span class="tag">React</span>
    <span class="tag">Full-Featured</span>
  </div>
</div>

</div>

## Individual Plans

<div class="plan-grid">

<div class="plan-card">
  <h3><a href="./042_USER_SERVICE_STANDARDS_REMEDIATION">042: User Service Standards Remediation</a></h3>
  <p>Bring user-service into compliance with platform backend standards including validation, error handling, and testing patterns.</p>
  <div class="tags">
    <span class="tag">Backend</span>
    <span class="tag">Standards</span>
  </div>
</div>

<div class="plan-card">
  <h3><a href="./033_FIX_JAVA_25_TEST_FAILURES">033: Fix Java 25 Test Failures</a></h3>
  <p>Fix 22 test failures when running with Java 25: R2DBC initialization, ArchUnit compatibility, and security test response codes.</p>
  <div class="tags">
    <span class="tag">Backend</span>
    <span class="tag">Testing</span>
    <span class="tag">Java 25</span>
  </div>
</div>

</div>

## Sub-Plans Reference

Initiatives are broken into independently-mergeable sub-plans:

| Initiative | Sub-Plans |
|------------|-----------|
| **050** Merchant Portal | [050A](./050A_DATABASE_SCHEMAS) Database, [050B](./050B_MERCHANDISE_SERVICE) Merchandise, [050C](./050C_PRICE_SERVICE) Price, [050D](./050D_INVENTORY_SERVICE) Inventory, [050E](./050E_DOCKER_INTEGRATION) Docker, [050F](./050F_MERCHANT_PORTAL) Portal UI |
| **048** Offline POS | [048A](./048A_OFFLINE_POS_GO_INFRASTRUCTURE) Go Infra, [048B](./048B_OFFLINE_POS_DATABASE) Database, [048C](./048C_OFFLINE_POS_SYNC) Sync, [048D](./048D_OFFLINE_POS_UI) UI, [048E](./048E_OFFLINE_POS_PERIPHERAL) Peripheral |

---

::: tip Browse the archive
See [Completed Plans](/plans/completed/) for 70+ historical implementation plans.
:::
