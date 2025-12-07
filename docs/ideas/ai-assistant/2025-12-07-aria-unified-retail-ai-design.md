# Aria — Unified Retail AI Assistant

**Date:** 2025-12-07
**Status:** Idea / Big Picture Vision
**Scope:** Long-term strategic capability across all retail applications

---

## Vision & Strategic Intent

Aria is a centralized AI assistant that manifests across every retail touchpoint with a consistent identity but contextually-adapted capabilities. Unlike bolt-on chatbots that answer FAQs, Aria is deeply integrated with the retail knowledge graph — understanding products, customers, and operations as interconnected domains.

### Strategic Positioning

- **Differentiation first**: Aria isn't a cost-reduction play. It's a capability competitors can't easily replicate because it requires unified data, consistent UX investment, and continuous learning infrastructure.
- **Progressive trust model**: Aria starts as an advisor ("here's what I found") and earns autonomy over time ("I've scheduled the optimal delivery for you"). This builds user confidence while reducing risk.
- **Multimodal by design**: Chat when browsing, voice when hands are busy, embedded nudges when users just need guidance. Aria meets users in their context.

### Flagship Proof Point — POS Associate Copilot

The associate-facing experience is the beachhead. Associates are a forgiving, feedback-rich audience. Success here creates a force multiplier: one empowered associate improves outcomes for every customer they serve. Learnings from associates inform the customer-facing rollout.

### Long-term Vision

Every retail app built on this platform gets AI capabilities "for free" by embedding Aria components. New apps launch smarter, not dumber.

---

## Knowledge Architecture

### The Unified Retail Knowledge Graph

Aria's intelligence comes from connecting three domains that are typically siloed:

#### Product Intelligence
- Catalog attributes, descriptions, images
- Compatibility relationships ("works with", "requires", "replaces")
- Substitutes and alternatives with reasoning
- Use cases and application guidance
- Real-time inventory and availability

#### Customer Intelligence
- Purchase history and browsing patterns
- Loyalty status, preferences, saved lists
- Interaction history (returns, support contacts, feedback)
- Household/account relationships
- Communication preferences and consent

#### Operational Intelligence
- Order lifecycle events (placed → picked → shipped → delivered)
- Fulfillment states, carrier tracking, exceptions
- Promotion rules, discount eligibility, stacking logic
- Store policies, procedures, exception handling
- Delivery windows, capacity, and optimization

### The Power Is in the Connections

- "This customer bought primer last month" + "This paint requires primer" = "They're probably set, but confirm"
- "Order cancelled" + "Inventory event 2 hours prior" + "No restock expected" = "Out of stock was the cause, suggest alternative"
- "Customer is loyalty platinum" + "Policy allows manager override" = "You can offer the accommodation"

The knowledge graph isn't a separate database — it's a query layer that federates across existing services (product-service, order-service, customer-service, etc.) and enriches with AI-derived insights.

---

## Technical Architecture

### Centralized AI Service — "aria-service"

A new service joins the platform as the AI orchestration layer. It doesn't replace existing services — it sits alongside them as a consumer and synthesizer.

#### Core Responsibilities
- **Context assembly**: Gathers relevant data from domain services based on the user's question/situation
- **Reasoning**: Applies LLM capabilities to analyze, explain, and recommend
- **Response generation**: Produces answers in the appropriate modality (text, voice, structured data for UI)
- **Action execution**: For delegated tasks, orchestrates calls to domain services (with user permission)
- **Learning capture**: Records interactions, feedback, and outcomes for continuous improvement

#### Integration Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Client Apps                          │
│  (ecommerce-web, kiosk-app, pos-app)                   │
│         ↓ embed Aria components from libs/frontend      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    aria-service                         │
│  • Context assembly    • Reasoning    • Learning        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌──────────┬──────────┬──────────┬──────────┬────────────┐
│ product  │  order   │ customer │ discount │ fulfillment│
│ service  │  service │ service  │ service  │  service   │
└──────────┴──────────┴──────────┴──────────┴────────────┘
```

#### Resilience

Aria is additive, not critical-path. If aria-service is unavailable, apps degrade gracefully — users can still browse, order, and transact. AI features simply become unavailable.

---

## Frontend Component System

### Shared Aria Components in `libs/frontend/shared-ui/aria/`

A suite of embeddable React components that any app imports. Consistent experience, single source of truth.

#### Core Components

| Component | Purpose | Primary Use |
|-----------|---------|-------------|
| `<AriaChatPanel>` | Conversational interface | Full dialogue interactions |
| `<AriaVoiceButton>` | Voice input/output | Hands-busy scenarios |
| `<AriaSuggestionCard>` | Contextual nudge | Proactive recommendations |
| `<AriaInsightBanner>` | Passive intelligence | Alerts, warnings, tips |
| `<AriaOrderTimeline>` | Order diagnostic view | Troubleshooting visualization |
| `<AriaActionConfirm>` | Permission dialog | Before AI executes actions |

#### Context-Aware Behavior

Components detect their environment (which app, which user type, what screen) and adapt automatically:
- Same `<AriaChatPanel>` in POS speaks "associate language" with technical details
- Same component in ecommerce-web uses friendly consumer tone
- Same component at kiosk offers voice-first with large touch targets

#### Shared State via AriaProvider

```tsx
<AriaProvider userId={user.id} context="pos" role="associate">
  <App />
</AriaProvider>
```

All Aria components within the provider share conversation history, user context, and trust level.

#### Progressive Enhancement

Apps work without Aria. Adding `<AriaSuggestionCard>` to a product page is a one-line enhancement, not a rewrite.

---

## POS Associate Copilot — Flagship Capabilities

### Order Troubleshooting (Priority #1)

The associate asks: "Why was order 12345 cancelled?" or scans an order barcode.

Aria responds with progressive detail:

**Level 1 — Narrative summary:**
> "This order was cancelled because SKU-789 went out of stock 2 hours after purchase. The customer hasn't been notified yet."

**Level 2 — Timeline drill-down (on request):**
> Shows visual journey: Order placed → Inventory reserved → Stock adjustment event → Reservation failed → Auto-cancelled

**Level 3 — Suggested actions:**
> "Options: (1) Offer substitute SKU-790 at same price — it's in stock. (2) Reorder with expedited shipping, waive fee. (3) Issue refund with 10% off next purchase."

Associate picks an action, Aria executes with confirmation.

### Product Expertise (Priority #2)

Associate asks: "What's the difference between these two drills?" or "What battery fits this?"

Aria provides:
- Side-by-side comparison with key differentiators highlighted
- Compatibility information ("This battery fits models X, Y, Z")
- Customer-appropriate recommendation ("For occasional home use, the cheaper one is fine")

### Customer Context (Priority #3)

Associate scans loyalty card or looks up phone number.

Aria surfaces:
- Recent purchases relevant to current transaction
- Loyalty tier and available rewards
- Open issues or recent returns
- Personalization cues ("They usually buy professional-grade")

---

## Learning & Improvement System

### Closed-Loop Intelligence

Aria gets smarter through three complementary feedback channels:

#### Explicit Feedback (Immediate signal)
- Associates tap thumbs up/down after each response
- "Flag as incorrect" button captures errors with optional correction
- "This helped" / "This didn't help" on suggested actions
- Free-text feedback for nuanced issues

#### Implicit Signals (Pattern detection at scale)
- Which suggested actions do associates accept vs. dismiss?
- Time-to-resolution: did Aria speed things up or slow them down?
- Escalation rate: did the associate still need to call support?
- Repeat queries: same question asked differently suggests Aria missed the point

#### Expert Curation (Quality control)
- Weekly review of flagged responses and low-rated interactions
- Subject matter experts author corrections and expand knowledge
- New policies and procedures added proactively, not just reactively
- "Aria knowledge base" becomes a living, curated asset

### The Flywheel Effect

```
More associates use Aria
        ↓
More interactions generate feedback
        ↓
Feedback improves Aria's responses
        ↓
Better responses increase trust & usage
        ↓
(repeat)
```

### Transparency & Trust

Associates can see *why* Aria gave an answer ("Based on order history from order-service and inventory event from fulfillment-service"). This builds trust and helps experts diagnose when Aria is wrong.

---

## Expansion Roadmap

### From POS Flagship to Omnichannel Presence

Once the POS Associate Copilot proves value, Aria expands to other touchpoints using the same infrastructure:

#### Phase 1: POS Associate Copilot (Flagship)
- Order troubleshooting, product expertise, customer context
- Controlled rollout to pilot stores
- Intensive feedback collection, rapid iteration
- Success metrics: resolution time, escalation rate, associate satisfaction

#### Phase 2: E-commerce Shopping Assistant
- Leverage product expertise trained by associates
- Cart building guidance ("You'll also need primer for this paint")
- Comparison shopping ("Help me choose between these")
- Delivery optimization ("Find the best date for all my items")
- Progressive trust: suggestions first, then "add to cart for me", then "complete checkout"

#### Phase 3: Self-Checkout Rescue & Guidance
- Voice-first for hands-busy scanning
- SKU/barcode not found: "Describe the item or show me the package"
- Unfamiliar user guidance: "I'll walk you through it step by step"
- Escalation to associate when truly stuck (with context handoff)

#### Phase 4: Contact Center & L3 Support
- Same order troubleshooting, deeper technical access
- Cross-channel view: "Customer called twice, visited store once about this order"
- Suggested scripts and resolutions
- Direct action execution for authorized agents

### What Stays Constant Across Phases
- Unified identity (Aria)
- Same knowledge graph
- Same learning system (insights from all channels improve all channels)
- Same component library (adapted to context)

---

## Risks & Open Questions

### Technical Risks

| Risk | Mitigation |
|------|------------|
| LLM latency impacts associate productivity | Cache common queries, pre-compute likely questions per context |
| Hallucination leads to bad advice | Ground responses in structured data, cite sources, explicit "I don't know" |
| Central service becomes bottleneck | Async patterns, graceful degradation, Aria is additive not critical |
| Knowledge graph query complexity | Start with targeted use cases, expand federation incrementally |

### Organizational Risks

| Risk | Mitigation |
|------|------------|
| Associates distrust or ignore Aria | Involve associates in design, celebrate corrections, show improvement over time |
| Expert curation becomes bottleneck | Prioritize by impact (frequency × severity), automate easy cases |
| Scope creep delays flagship | Ruthless MVP scoping, resist "one more feature" before proving value |

### Open Questions for Future Exploration

1. **LLM provider strategy**: Build on one provider (OpenAI, Anthropic, Google) or abstract for flexibility?
2. **Data privacy boundaries**: What customer data can Aria access? Associate-only vs. customer-facing may differ.
3. **Offline capability**: Do kiosk/POS need local models for resilience, or is network dependency acceptable?
4. **Multi-language support**: When and how does Aria handle multiple languages?
5. **Voice persona**: What does Aria *sound* like? Neutral, warm, professional?

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Business priority | Differentiation > Friction reduction > Scale expertise | Creates competitive moat, not just cost savings |
| AI presence | Hybrid (unified identity, contextual modes) | Brand consistency with situational adaptation |
| Interaction style | Multimodal | Meet users in their context |
| Autonomy model | Progressive trust | Build confidence, reduce risk |
| Knowledge sources | Unified graph (products + customers + operations) | Connections create intelligence |
| Architecture | Centralized aria-service | Consistency, easier evolution |
| Failure handling | Graceful handoff + transparency + learning | Never strand users, always improve |
| Integration | Widget/component system | Monorepo-friendly, rapid adoption |
| Flagship | POS Associate Copilot | Controlled audience, force multiplier |
| Capability priority | Order troubleshooting > Product expertise > Customer context > Policy | Highest value, hardest problem first |
