# Microscope Design Document

**Date**: 2024-12-13
**Status**: Draft
**Author**: Brainstorming session

---

## Overview

**Microscope** is a transaction investigation tool for L3-L4 support, engineers, and operations. It provides deep visibility into a single transaction's lifecycle — what happened, why, what's next, and what's blocking.

### Core Capabilities

- **Unified view**: One place to see cart → checkout → order → fulfillment → delivery/return
- **State machine visualization**: Interactive diagram showing current state, history, and possible next states
- **Timeline**: Chronological event log with expandable details
- **Rule awareness**: Explains why a transaction is in its current state, surfaces blockers
- **Observability integration**: On-demand access to logs (Loki), traces (Tempo), and audit events
- **Deep linking**: Links out to operational systems when action is needed

### What It's NOT

- Not a dashboard (no aggregates, trends, or KPIs)
- Not an operational tool (no actions — read-only with links out)
- Not for end customers (internal tool for experts)

### Primary Users

- L3-L4 expert support
- Engineers (debugging production issues)
- Operations staff

### Entry Points (Priority Order)

1. **Direct ID** — paste an order ID, cart ID, checkout session ID
2. **Trace ID** — paste a trace ID from an alert or log
3. **Customer search** — find by customer ID, email, phone

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         microscope-web                               │
│                    (React + React Flow)                              │
│         State diagrams, timelines, search, detail panels             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ REST/GraphQL
┌─────────────────────────────▼───────────────────────────────────────┐
│                      microscope-service                              │
│                   (Spring WebFlux + R2DBC)                           │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ Transaction │  │   Rule      │  │ Observability│  │  Search    │  │
│  │ Correlator  │  │   Engine    │  │   Gateway    │  │  Gateway   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
└─────────┼────────────────┼────────────────┼────────────────┼────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ order-     │   │ Markdown   │   │ Loki       │   │ audit-     │
   │ service    │   │ Rule Docs  │   │ Tempo      │   │ service    │
   │ cart-      │   │ (files)    │   │ Prometheus │   │            │
   │ service    │   │            │   │            │   │            │
   │ checkout-  │   │            │   │            │   │            │
   │ service    │   │            │   │            │   │            │
   └────────────┘   └────────────┘   └────────────┘   └────────────┘
```

### Key Modules in microscope-service

| Module | Responsibility |
|--------|----------------|
| **Transaction Correlator** | Fetches and stitches data from cart, checkout, order, fulfillment services into unified transaction view |
| **Rule Engine** | Loads markdown rule docs, matches rules to current state, explains blockers |
| **Observability Gateway** | Queries Loki (logs), Tempo (traces) on-demand, filters by entity/trace ID |
| **Search Gateway** | Routes search by ID type, customer lookup, trace ID correlation |

### Data Flow

Frontend requests → microscope-service correlates → lazy-loads detail from sources → returns unified response

---

## Data Model

### Core Entity: TransactionView

```java
TransactionView {
  id: UUID                     // Primary entity ID (order, cart, etc.)
  type: CART | CHECKOUT | ORDER | RETURN

  // Current state
  currentState: String         // e.g., "PROCESSING", "PAYMENT_FAILED"
  stateEnteredAt: Instant

  // State machine definition (for rendering diagram)
  stateMachine: {
    states: [{ id, label, terminal }]
    transitions: [{ from, to, trigger, guardCondition }]
    currentStateId: String
    visitedStates: [{ stateId, enteredAt, exitedAt }]
  }

  // Timeline (collapsed by default, expandable)
  events: [{
    id, timestamp, type, source,
    summary: String,           // Human-readable
    details: JSON,             // Expandable raw data
    ruleReference: String?     // Link to rule doc if applicable
  }]

  // Linked entities
  linkedEntities: [{
    type: CART | ORDER | CUSTOMER | FULFILLMENT | RETURN
    id: UUID
    label: String              // e.g., "Original Cart", "Return #123"
  }]

  // Rule evaluation (blockers, explanations)
  ruleEvaluation: {
    applicableRules: [{ ruleId, docPath, summary }]
    blockers: [{ condition, currentValue, requiredValue, ruleRef }]
    nextPossibleActions: [{ action, requirements, deepLink }]
  }

  // Observability links (fetched on-demand)
  traceIds: [String]
  logQueryTemplate: String     // Pre-built Loki query
}
```

### On-Demand Detail Payloads

Loaded when user expands sections:

- **LogsDetail** — filtered Loki results for this entity
- **TraceDetail** — Tempo trace spans
- **AuditDetail** — Full audit event payloads
- **SwimlaneDiagram** — Service-by-service breakdown

---

## UI Layout

### Main Screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔬 MICROSCOPE                                    [Search: ________] 🔍 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    STATE MACHINE DIAGRAM                         │   │
│  │                                                                  │   │
│  │   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐         │   │
│  │   │ CREATED│───▶│CHECKOUT│───▶│PAYMENT │───▶│CONFIRM │         │   │
│  │   └────────┘    └────────┘    └───┬────┘    └────────┘         │   │
│  │       ✓             ✓             │             ○               │   │
│  │                                   │                              │   │
│  │                              ┌────▼────┐                         │   │
│  │                              │ FAILED  │  ◀── YOU ARE HERE       │   │
│  │                              └─────────┘                         │   │
│  │                                                                  │   │
│  │   Legend: ✓ visited  ● current  ○ possible next  ─ ─ blocked    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────┐  ┌────────────────────────────────┐  │
│  │  BLOCKERS & NEXT STEPS       │  │  TRANSACTION SUMMARY           │  │
│  │                              │  │                                │  │
│  │  ❌ Payment declined         │  │  Order: #ORD-12345             │  │
│  │     Card expired 01/24       │  │  Cart:  #CART-67890            │  │
│  │     Rule: payment-validation │  │  Customer: John Smith          │  │
│  │     [→ Retry Payment]        │  │  Store: 142                    │  │
│  │                              │  │  Total: $234.56                │  │
│  │  ✅ Inventory reserved       │  │  Created: 2024-12-13 10:32 AM  │  │
│  │  ✅ Customer validated       │  │                                │  │
│  └──────────────────────────────┘  └────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TIMELINE                                          [Expand All]  │   │
│  │                                                                  │   │
│  │  10:32:01  Cart created                              cart-svc   │   │
│  │  10:32:15  Product added (SKU-001 x2)                cart-svc   │   │
│  │  10:33:42  Checkout initiated                        checkout   │   │
│  │  10:33:43  Inventory reserved                        product    │   │
│  │  10:33:45  Payment attempted                         checkout   │   │
│  │  10:33:46  ❌ Payment declined - Card expired        checkout   │   │
│  │            [View Logs] [View Trace] [View Audit Event]          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [View Swimlane]  [View Raw JSON]  [Copy Transaction ID]               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Secondary Views

| View | Purpose |
|------|---------|
| **Swimlane** | Service-by-service breakdown showing which service handled each step |
| **Logs Panel** | Filtered Loki logs for this transaction (lazy-loaded) |
| **Traces Panel** | Tempo trace waterfall for correlated trace IDs |
| **Audit Events** | Full audit trail with expandable payloads |
| **Raw JSON** | Complete TransactionView payload for engineers |
| **Linked Entities** | Navigate to related carts, orders, returns |

---

## Business Rule Integration

### Rule Documentation Structure

```
docs/
└── business-rules/
    ├── cart/
    │   ├── cart-creation.md
    │   ├── cart-validation.md
    │   └── cart-expiration.md
    ├── checkout/
    │   ├── checkout-eligibility.md
    │   ├── payment-validation.md
    │   └── inventory-reservation.md
    ├── order/
    │   ├── order-states.md
    │   ├── cancellation-rules.md
    │   └── modification-rules.md
    ├── fulfillment/
    │   ├── fulfillment-assignment.md
    │   ├── delivery-scheduling.md
    │   └── rescheduling-rules.md
    └── returns/
        ├── return-eligibility.md
        ├── refund-rules.md
        └── exchange-rules.md
```

### Rule Document Format

```markdown
---
id: payment-validation
applies_to: checkout
states: [PAYMENT_PENDING, PAYMENT_FAILED]
version: 1.2
---

# Payment Validation Rules

## Card Expiration
- Card must not be expired at time of transaction
- **Blocker condition**: `card.expirationDate < now()`
- **Resolution**: Customer must update payment method

## Minimum Amount
- Order total must be >= $1.00
- **Blocker condition**: `order.total < 1.00`
- **Resolution**: Add items to cart

## Fraud Check
- Orders > $500 require fraud review for new customers
- **Blocker condition**: `order.total > 500 AND customer.orderCount == 0`
- **Resolution**: Manager approval required [→ Fraud Review Queue]
```

### Rule Engine Behavior

1. **Load**: On startup, index all rule markdown files
2. **Match**: When building TransactionView, match current state to applicable rules
3. **Evaluate**: Check blocker conditions against transaction data
4. **Explain**: Surface rule ID, human-readable explanation, resolution steps
5. **Gaps**: If state has no matching rule docs, flag as "Undocumented state transition"

---

## Deep Linking

### Outbound Links (Microscope → Operational Systems)

| Action | Target System | Deep Link Pattern |
|--------|---------------|-------------------|
| Retry Payment | Checkout UI | `/checkout/{sessionId}/payment` |
| Cancel Order | Order Management | `/orders/{orderId}/cancel` |
| Modify Fulfillment | Fulfillment UI | `/fulfillment/{fulfillmentId}/edit` |
| Customer Profile | Customer Service | `/customers/{customerId}` |
| Fraud Review | Merchant Portal | `/fraud-review?orderId={orderId}` |
| Refund | Order Management | `/orders/{orderId}/refund` |

### Inbound Links (Other Systems → Microscope)

```
/microscope/transaction/{id}           # Direct by ID
/microscope/trace/{traceId}            # From alert/PagerDuty
/microscope/customer/{customerId}      # From support tool
/microscope/search?q={query}           # Generic search
```

### Link Generation

microscope-service includes deep link URLs in `nextPossibleActions`, computed based on entity type and state.

---

## Technical Stack

### Backend (microscope-service)

| Component | Technology |
|-----------|------------|
| Framework | Spring Boot 3.4 + WebFlux |
| Database | PostgreSQL (R2DBC) for caching rule index (optional) |
| HTTP Client | WebClient for service calls |
| Observability Clients | Loki HTTP API, Tempo HTTP API |
| Rule Parser | CommonMark + YAML frontmatter |
| Caching | Redis (via platform-cache) |
| Platform Libraries | platform-logging, platform-webflux, platform-error |

### Frontend (microscope-web)

| Component | Technology |
|-----------|------------|
| Framework | React 18 + TypeScript |
| State Management | TanStack Query (server state) |
| Diagrams | React Flow for state machines |
| Timeline | Custom component or react-chrono |
| Styling | Tailwind CSS + shared design tokens |
| API Client | Generated from OpenAPI spec |

### Ports

| Service | Port |
|---------|------|
| microscope-service | 8092 |
| microscope-web (dev) | 4201 |
| microscope-web (docker) | 3002 |

---

## Implementation Phases

### Phase 1: Foundation
- Create microscope-service with basic project structure
- Create microscope-web with basic layout
- Implement search by Order ID, Cart ID
- Connect to order-service, cart-service APIs
- Basic TransactionView response (no rules yet)

### Phase 2: Visualization
- State machine diagram component (React Flow)
- Timeline component with expandable events
- Linked entities navigation
- Swimlane view

### Phase 3: Observability Integration
- Loki log queries by entity ID
- Tempo trace lookup by trace ID
- Audit event integration
- On-demand lazy loading

### Phase 4: Business Rules
- Rule document structure and initial docs
- Rule parser and indexer
- Blocker evaluation engine
- "Undocumented rule" gap detection

### Phase 5: Deep Linking
- Outbound links to operational systems
- Inbound link routes
- Integration with PagerDuty/alerting for trace ID links

---

## Open Questions

1. **State machine definitions**: Should these be hardcoded per entity type, or loaded from configuration/documentation?
2. **Rule expression language**: How complex should blocker conditions be? Simple field comparisons vs. full expression language?
3. **Caching strategy**: Should TransactionView be cached, or always fetched fresh?
4. **Authentication**: Same auth as other internal tools, or separate?
5. **Audit of Microscope usage**: Should we log who looked at which transactions?

---

## Appendix: State Machines by Entity Type

### Cart States
```
CREATED → ACTIVE → CHECKOUT_STARTED → CONVERTED | ABANDONED | EXPIRED
```

### Checkout States
```
INITIATED → PAYMENT_PENDING → PAYMENT_FAILED → (retry)
                            → PAYMENT_SUCCESS → ORDER_CREATED
```

### Order States
```
CREATED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                   → CANCELLED
                   → REFUNDED
```

### Fulfillment States
```
PENDING → ASSIGNED → PICKING → PACKED → SHIPPED → DELIVERED
                                      → RETURNED
```

### Return States
```
REQUESTED → APPROVED → RECEIVED → INSPECTED → REFUNDED | EXCHANGED | REJECTED
```
