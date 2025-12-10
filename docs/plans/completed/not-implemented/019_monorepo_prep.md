# 019_MONOREPO_PREP

**Status: PROPOSED**

---

## Overview

Follow-ups for ADR 006 (Frontend Monorepo Strategy) to close the newly documented open questions and harden service/port mappings. Scope: decide the canonical package manager, publish Nx↔Gradle target mappings (including caching/affected behavior), and reconcile service ports with an automated check to prevent regressions.

## Goals

1. Select and document a single package manager (pnpm vs npm); remove conflicting scripts/lockfiles.
2. Define Nx ↔ Gradle target mapping and cache coordination for existing backend tasks (e.g., `buildAll`, `testAll`, module builds).
3. Establish a canonical service port table, eliminate host port collisions, and add a repeatable verification script.

## Deliverables

- Updated ADR 006 + AGENTS.md with the chosen package manager and authoritative service port table.
- Nx/Gradle mapping note (location TBA) describing target names and how `nx run-many`/`nx affected` drive Gradle tasks.
- Port verification utility (`tools/check-service-ports.sh`) plus expectation data and docs for developer/CI use.

## Work Plan

### 1) Package Manager Decision
- Compare pnpm vs npm for CI/CD, workspace support, and existing tooling constraints.
- Decide, document, and standardize scripts; ensure only one lockfile is present and referenced in Docker builds.

### 2) Nx ↔ Gradle Integration Map
- Spike `@nx/gradle` on current modules to expose `build`/`test`/`bootRun` equivalents.
- Define target naming conventions and cache layering to avoid double caching.
- Document developer workflows for running backend tasks via Nx (including affected runs).

### 3) Service Port Canonicalization
- Reconcile port conflicts (e.g., cart-service 8081 vs 8082 docs; discount-service vs fulfillment-service sharing 8085).
- Update `docker/docker-compose.yml`, docs, and any client/test configs to the canonical map.
- Wire `tools/check-service-ports.sh` into CI or preflight checks with the final expectation file.

## Dependencies / Notes

- Port changes may require updates to Dockerfiles, k6 scripts, and client configs.
- Nx spike may expose Gradle version/plugin constraints; capture blockers explicitly.

## Exit Criteria

- Single package manager enforced at root with aligned scripts and lockfile.
- Published Nx/Gradle target map with at least one backend module runnable via Nx.
- Port check script passes with no host port collisions and matches the canonical table.
