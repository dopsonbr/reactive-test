# 038B_KIOSK_APP_SCAFFOLD

**Status: DRAFT**

---

## Overview

Create the `kiosk-web` Nx application with session management, service account authentication, and touch-optimized layout infrastructure.

**Related Plans:**
- `038_SELF_CHECKOUT_KIOSK.md` - Parent initiative
- `038A_SHARED_COMMERCE_COMPONENTS.md` - Prerequisite (shared libs)
- `038C_KIOSK_FEATURES.md` - Depends on this plan

## Goals

1. Scaffold `kiosk-web` Nx application with Vite + React + TanStack Router
2. Implement kiosk session management (store assignment, transaction lifecycle)
3. Configure service account authentication flow
4. Create touch-optimized layout with kiosk-specific styling
5. Set up inactivity timeout and transaction reset

## References

**Standards:**
- `docs/standards/frontend/architecture.md` - App structure

---

## Phase 1: Application Scaffolding

**Prereqs:** pnpm, Nx workspace
**Blockers:** None

### 1.1 Generate Nx Application

**Files:**
- CREATE: `apps/kiosk-web/project.json`
- CREATE: `apps/kiosk-web/vite.config.ts`
- CREATE: `apps/kiosk-web/tsconfig.json`
- CREATE: `apps/kiosk-web/tsconfig.app.json`
- CREATE: `apps/kiosk-web/index.html`
- CREATE: `apps/kiosk-web/tailwind.config.ts`
- CREATE: `apps/kiosk-web/postcss.config.js`
- CREATE: `apps/kiosk-web/.env.example`

**Implementation:**
```bash
pnpm nx g @nx/react:application kiosk-web \
  --directory=apps/kiosk-web \
  --bundler=vite \
  --routing=false \
  --style=css \
  --tags="type:app,scope:kiosk,platform:web"
```

```json
// project.json
{
  "name": "kiosk-web",
  "tags": ["type:app", "scope:kiosk", "platform:web"],
  "targets": {
    "serve": {
      "options": {
        "port": 3002
      }
    }
  }
}
```

### 1.2 Configure Vite

**Files:**
- MODIFY: `apps/kiosk-web/vite.config.ts`

**Implementation:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/products': 'http://localhost:8080',
      '/carts': 'http://localhost:8081',
      '/customers': 'http://localhost:8083',
      '/checkout': 'http://localhost:8087',
      '/fake-auth': 'http://localhost:8082',
    },
  },
});
```

### 1.3 Configure Tailwind

**Files:**
- MODIFY: `apps/kiosk-web/tailwind.config.ts`

**Implementation:**
```typescript
export default {
  content: [
    './src/**/*.{ts,tsx}',
    '../../libs/frontend/shared-ui/**/*.{ts,tsx}',
  ],
  presets: [sharedPreset],  // Use shared design tokens
  theme: {
    extend: {
      // Kiosk-specific: larger touch targets
      spacing: {
        'touch': '44px',      // Minimum touch target
        'touch-lg': '64px',   // Comfortable touch target
      },
      fontSize: {
        'kiosk-sm': '1.125rem',   // 18px min for readability
        'kiosk-base': '1.25rem',  // 20px
        'kiosk-lg': '1.5rem',     // 24px
        'kiosk-xl': '2rem',       // 32px
        'kiosk-2xl': '2.5rem',    // 40px
      },
    },
  },
};
```

---

## Phase 2: App Entry & Providers

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Main Entry Point

**Files:**
- CREATE: `apps/kiosk-web/src/main.tsx`

**Implementation:**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import '@reactive-platform/shared-design-tokens';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 2.2 App Component & Providers

**Files:**
- CREATE: `apps/kiosk-web/src/app/App.tsx`
- CREATE: `apps/kiosk-web/src/app/providers.tsx`

**Implementation:**
```typescript
// providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <KioskSessionProvider>
        <RouterProvider router={router} />
      </KioskSessionProvider>
    </QueryClientProvider>
  );
}
```

### 2.3 TanStack Router Setup

**Files:**
- CREATE: `apps/kiosk-web/src/app/router.tsx`
- CREATE: `apps/kiosk-web/src/app/routes/index.tsx`
- CREATE: `apps/kiosk-web/src/app/routes/__root.tsx`

**Implementation:**
```typescript
// Route structure for kiosk flow
const routeTree = rootRoute.addChildren([
  startRoute,     // /
  scanRoute,      // /scan
  cartRoute,      // /cart
  loyaltyRoute,   // /loyalty
  checkoutRoute,  // /checkout
  confirmRoute,   // /confirm
]);
```

---

## Phase 3: Kiosk Session Management

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Session Context

**Files:**
- CREATE: `apps/kiosk-web/src/features/session/context/KioskSessionContext.tsx`
- CREATE: `apps/kiosk-web/src/features/session/context/KioskSessionProvider.tsx`

**Implementation:**
```typescript
interface KioskSession {
  // Store configuration (set at kiosk startup)
  storeNumber: number;
  kioskId: string;
  serviceAccountId: string;

  // Transaction state (reset per customer)
  transactionId: string;
  cartId: string | null;
  customerId: string | null;
  checkoutId: string | null;

  // Transaction lifecycle
  transactionState: 'idle' | 'active' | 'checkout' | 'complete';
  startedAt: Date | null;
  lastActivityAt: Date;

  // Actions
  startTransaction: () => void;
  linkCustomer: (customerId: string) => void;
  setCartId: (cartId: string) => void;
  setCheckoutId: (checkoutId: string) => void;
  completeTransaction: () => void;
  resetTransaction: () => void;
}

// Derived helpers
interface CartScope {
  cartId: string;
  headers: Record<string, string>; // forwarded into commerce-hooks
}

function useCartScope(): CartScope;
```

> Expose a `useCartScope()` hook (or equivalent selector) from the session provider so kiosk features can call the shared commerce hooks without reinventing cart ID/header plumbing. This keeps kiosk aligned with the `commerce-hooks` contract introduced in 038A.

### 3.2 Session Storage Integration

**Files:**
- CREATE: `apps/kiosk-web/src/features/session/hooks/useSessionStorage.ts`

**Implementation:**
```typescript
// Sync session state to sessionStorage for api-client headers
function syncToSessionStorage(session: KioskSession) {
  sessionStorage.setItem('storeNumber', String(session.storeNumber));
  sessionStorage.setItem('orderNumber', session.transactionId);
  sessionStorage.setItem('userId', session.serviceAccountId);
  sessionStorage.setItem('sessionId', session.kioskId);
  if (session.customerId) {
    sessionStorage.setItem('customerId', session.customerId);
  }
}
```

### 3.3 Inactivity Timeout

**Files:**
- CREATE: `apps/kiosk-web/src/features/session/hooks/useInactivityTimeout.ts`
- CREATE: `apps/kiosk-web/src/features/session/components/TimeoutWarningDialog.tsx`

**Implementation:**
```typescript
interface UseInactivityTimeoutOptions {
  warningTimeout: number;  // Show warning after X seconds (default: 90)
  resetTimeout: number;    // Auto-reset after warning + X seconds (default: 30)
  onWarning: () => void;
  onTimeout: () => void;
}

export function useInactivityTimeout(options: UseInactivityTimeoutOptions) {
  // Track touch/click/keypress events
  // Reset timer on any activity
  // Show warning dialog when warningTimeout reached
  // Call onTimeout if no activity during warning period
}
```

---

## Phase 4: Service Account Authentication

**Prereqs:** Phase 3 complete, fake-auth endpoint (035)
**Blockers:** 035_FAKE_AUTH_DOCKER must be complete

### 4.1 Kiosk Auth Service

**Files:**
- CREATE: `apps/kiosk-web/src/features/auth/services/kioskAuth.ts`

**Implementation:**
```typescript
interface KioskAuthConfig {
  storeNumber: number;
  kioskId: string;
}

export async function authenticateKiosk(config: KioskAuthConfig): Promise<AuthToken> {
  // Kiosk uses service account credentials
  // In fake-auth: username = `kiosk-${storeNumber}-${kioskId}`
  const response = await fetch('/fake-auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `kiosk-${config.storeNumber}-${config.kioskId}`,
      grant_type: 'client_credentials',
    }),
  });
  return response.json();
}
```

### 4.2 Auth Context for Kiosk

**Files:**
- CREATE: `apps/kiosk-web/src/features/auth/context/KioskAuthContext.tsx`

**Implementation:**
```typescript
interface KioskAuthState {
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: Date | null;
  refreshToken: () => Promise<void>;
}

// Auto-refresh token before expiry
// Store token in sessionStorage for api-client
```

### 4.3 Startup Configuration Screen

**Files:**
- CREATE: `apps/kiosk-web/src/features/auth/pages/KioskSetupPage.tsx`
- CREATE: `apps/kiosk-web/src/features/auth/components/StoreSelector.tsx`

**Implementation:**
```typescript
// First-time setup or admin access
// Configure: storeNumber, kioskId
// Authenticate with service account
// Store config in localStorage (persists across sessions)
```

---

## Phase 5: Kiosk Layout & Styling

**Prereqs:** Phase 2 complete
**Blockers:** None

### 5.1 Root Layout

**Files:**
- CREATE: `apps/kiosk-web/src/shared/layouts/KioskLayout.tsx`

**Implementation:**
```typescript
interface KioskLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  title?: string;
}

// Full-screen layout optimized for touch
// Header: Store name, transaction ID, cart count
// Footer: Help button, language selector
// No scroll on main container (fixed viewport)
```

### 5.2 Kiosk Header

**Files:**
- CREATE: `apps/kiosk-web/src/shared/layouts/KioskHeader.tsx`

**Implementation:**
```typescript
// Minimal header for kiosk mode
// Store name/number
// Transaction ID (for support reference)
// Cart item count badge
// Cancel transaction button
```

### 5.3 Kiosk Footer

**Files:**
- CREATE: `apps/kiosk-web/src/shared/layouts/KioskFooter.tsx`

**Implementation:**
```typescript
// Help/assistance button (calls attendant)
// Language selector (if multi-language)
// Accessibility options
```

### 5.4 Touch-Optimized Styles

**Files:**
- CREATE: `apps/kiosk-web/src/styles/kiosk.css`

**Implementation:**
```css
/* Disable text selection (prevent accidental selection on touch) */
.kiosk-screen {
  user-select: none;
  -webkit-user-select: none;
}

/* Larger touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Prevent zoom on double-tap */
html {
  touch-action: manipulation;
}

/* Hide scrollbars */
::-webkit-scrollbar {
  display: none;
}
```

---

## Phase 6: Start Screen

**Prereqs:** Phases 3-5 complete
**Blockers:** None

### 6.1 Start Page

**Files:**
- CREATE: `apps/kiosk-web/src/features/start/pages/StartPage.tsx`

**Implementation:**
```typescript
// Large "Touch to Start" button
// Store branding/logo
// Current date/time display
// Idle animation or promotional content
// On touch: startTransaction() → navigate to /scan
```

### 6.2 Idle Screen (Optional)

**Files:**
- CREATE: `apps/kiosk-web/src/features/start/components/IdleScreen.tsx`

**Implementation:**
```typescript
// Shown when no transaction active
// Promotional content rotation
// Attract loop for customer attention
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/kiosk-web/project.json` | Nx project config |
| CREATE | `apps/kiosk-web/vite.config.ts` | Vite build config |
| CREATE | `apps/kiosk-web/tailwind.config.ts` | Tailwind with touch targets |
| CREATE | `apps/kiosk-web/src/main.tsx` | App entry |
| CREATE | `apps/kiosk-web/src/app/App.tsx` | Root component |
| CREATE | `apps/kiosk-web/src/app/providers.tsx` | Context providers |
| CREATE | `apps/kiosk-web/src/app/router.tsx` | TanStack Router |
| CREATE | `apps/kiosk-web/src/features/session/` | Session management |
| CREATE | `apps/kiosk-web/src/features/auth/` | Kiosk auth |
| CREATE | `apps/kiosk-web/src/shared/layouts/` | Kiosk layouts |
| CREATE | `apps/kiosk-web/src/features/start/` | Start screen |
| MODIFY | `docker/docker-compose.yml` | Add kiosk-web service |
| MODIFY | `CLAUDE.md` | Add kiosk-web to apps table |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add kiosk-web to Applications table (port 3002) |
| `apps/kiosk-web/README.md` | Document kiosk setup and configuration |
| `apps/kiosk-web/AGENTS.md` | AI guidance for kiosk development |
| `docker/docker-compose.yml` | Add kiosk-web service on port 3002 |

---

## Checklist

- [ ] Phase 1: App scaffolded with Vite + Tailwind
- [ ] Phase 2: Providers and router configured
- [ ] Phase 3: Session management implemented
- [ ] Phase 4: Service account auth working
- [ ] Phase 5: Touch-optimized layouts created
- [ ] Phase 6: Start screen functional
- [ ] Documentation updated
