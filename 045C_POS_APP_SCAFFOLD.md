# 045C_POS_APP_SCAFFOLD

**Status: DRAFT**

---

## Overview

Create the `pos-web` Nx application with role-based authentication, navigation structure, and dashboard home page that supports future order management functionality.

**Related Plans:**
- `045_POS_SYSTEM.md` - Parent initiative
- `045A_POS_BACKEND_ENHANCEMENTS.md` - Backend APIs used
- `045B_POS_UI_COMPONENTS.md` - UI components used
- `045D_POS_TRANSACTION_FLOW.md` - Depends on scaffold

## Goals

1. Scaffold `pos-web` Nx application with Vite + React + TanStack Router
2. Implement role-based authentication with permission checking
3. Create main layout with navigation sidebar
4. Build dashboard home page with quick actions and metrics
5. Set up extensible route structure for order management

---

## Phase 1: Application Scaffolding

**Prereqs:** pnpm, Nx workspace
**Blockers:** None

### 1.1 Generate Nx Application

**Files:**
- CREATE: `apps/pos-web/project.json`
- CREATE: `apps/pos-web/vite.config.ts`
- CREATE: `apps/pos-web/tsconfig.json`
- CREATE: `apps/pos-web/tsconfig.app.json`
- CREATE: `apps/pos-web/index.html`
- CREATE: `apps/pos-web/tailwind.config.ts`
- CREATE: `apps/pos-web/postcss.config.js`
- CREATE: `apps/pos-web/.env.example`

**Command:**
```bash
pnpm nx g @nx/react:application pos-web \
  --directory=apps/pos-web \
  --bundler=vite \
  --routing=false \
  --style=css \
  --tags="type:app,scope:pos,platform:web"
```

**project.json:**
```json
{
  "name": "pos-web",
  "tags": ["type:app", "scope:pos", "platform:web"],
  "targets": {
    "serve": {
      "options": {
        "port": 3003
      }
    }
  }
}
```

### 1.2 Configure Vite

**Files:**
- MODIFY: `apps/pos-web/vite.config.ts`

**Implementation:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    proxy: {
      '/products': 'http://localhost:8080',
      '/carts': 'http://localhost:8081',
      '/customers': 'http://localhost:8083',
      '/discount': 'http://localhost:8084',
      '/markdowns': 'http://localhost:8084',
      '/fulfillments': 'http://localhost:8085',
      '/checkout': 'http://localhost:8087',
      '/orders': 'http://localhost:8088',
      '/fake-auth': 'http://localhost:8082',
    },
  },
});
```

---

## Phase 2: Authentication & Authorization

**Prereqs:** Phase 1, fake-auth endpoint
**Blockers:** None

### 2.1 User Role Model

**Files:**
- CREATE: `apps/pos-web/src/features/auth/types/roles.ts`

**Implementation:**
```typescript
export enum UserRole {
  ASSOCIATE = 'ASSOCIATE',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  CONTACT_CENTER = 'CONTACT_CENTER',
  B2B_SALES = 'B2B_SALES',
}

export enum Permission {
  // Transaction
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_VOID = 'transaction:void',

  // Customer
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_EDIT = 'customer:edit',
  CUSTOMER_DELETE = 'customer:delete',
  CUSTOMER_SEARCH_ADVANCED = 'customer:search:advanced',

  // Markdown
  MARKDOWN_APPLY = 'markdown:apply',
  MARKDOWN_OVERRIDE = 'markdown:override',

  // Orders
  ORDER_VIEW = 'order:view',
  ORDER_EDIT = 'order:edit',
  ORDER_CANCEL = 'order:cancel',
  ORDER_REFUND = 'order:refund',

  // B2B
  B2B_NET_TERMS = 'b2b:net_terms',
  B2B_ACCOUNT_MANAGE = 'b2b:account:manage',

  // Admin
  ADMIN_REPORTS = 'admin:reports',
  ADMIN_SETTINGS = 'admin:settings',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ASSOCIATE]: [
    Permission.TRANSACTION_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.MARKDOWN_APPLY,
    Permission.ORDER_VIEW,
  ],
  [UserRole.SUPERVISOR]: [
    // All associate permissions plus:
    Permission.TRANSACTION_VOID,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_EDIT,
    Permission.ORDER_EDIT,
  ],
  [UserRole.MANAGER]: [
    // All supervisor permissions plus:
    Permission.CUSTOMER_DELETE,
    Permission.MARKDOWN_OVERRIDE,
    Permission.ORDER_CANCEL,
    Permission.ORDER_REFUND,
    Permission.ADMIN_REPORTS,
  ],
  [UserRole.ADMIN]: [
    // All permissions
  ],
  [UserRole.CONTACT_CENTER]: [
    Permission.TRANSACTION_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
  ],
  [UserRole.B2B_SALES]: [
    Permission.TRANSACTION_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_SEARCH_ADVANCED,
    Permission.B2B_NET_TERMS,
    Permission.B2B_ACCOUNT_MANAGE,
    Permission.ORDER_VIEW,
    Permission.ORDER_EDIT,
  ],
};
```

### 2.2 Auth Context

**Files:**
- CREATE: `apps/pos-web/src/features/auth/context/AuthContext.tsx`
- CREATE: `apps/pos-web/src/features/auth/context/AuthProvider.tsx`

**Implementation:**
```typescript
interface AuthContextValue {
  user: POSUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  permissions: Permission[];
  markdownTier: MarkdownPermissionTier | null;
  storeNumber: number | null;

  login: (username: string, storeNumber: number) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  canApplyMarkdown: (type: MarkdownType, amount: number) => boolean;
}

interface POSUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeNumber: number;
  employeeId: string;
}
```

### 2.3 Permission Hook

**Files:**
- CREATE: `apps/pos-web/src/features/auth/hooks/usePermission.ts`

**Implementation:**
```typescript
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useRequirePermission(permission: Permission): void {
  const hasIt = usePermission(permission);
  if (!hasIt) {
    throw new Error(`Missing required permission: ${permission}`);
  }
}
```

### 2.4 Protected Route Component

**Files:**
- CREATE: `apps/pos-web/src/features/auth/components/ProtectedRoute.tsx`
- CREATE: `apps/pos-web/src/features/auth/components/PermissionGate.tsx`

**Implementation:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

### 2.5 Login Page

**Files:**
- CREATE: `apps/pos-web/src/features/auth/pages/LoginPage.tsx`
- CREATE: `apps/pos-web/src/features/auth/components/LoginForm.tsx`

**Implementation:**
- Store number input
- Employee ID/username input
- Role selection (for dev/testing)
- Remember me option
- Error handling

---

## Phase 3: Layout & Navigation

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Main POS Layout

**Files:**
- CREATE: `apps/pos-web/src/shared/layouts/POSLayout.tsx`

**Implementation:**
```typescript
interface POSLayoutProps {
  children: React.ReactNode;
}

// Layout structure:
// ┌─────────────────────────────────────────────────┐
// │ Header (store info, user, notifications)        │
// ├──────────┬──────────────────────────────────────┤
// │          │                                      │
// │  Sidebar │           Main Content               │
// │   Nav    │                                      │
// │          │                                      │
// │          │                                      │
// └──────────┴──────────────────────────────────────┘
```

### 3.2 Sidebar Navigation

**Files:**
- CREATE: `apps/pos-web/src/shared/layouts/Sidebar.tsx`
- CREATE: `apps/pos-web/src/shared/layouts/SidebarNav.tsx`
- CREATE: `apps/pos-web/src/shared/layouts/SidebarNavItem.tsx`

**Implementation:**
```typescript
const navItems = [
  {
    label: 'Dashboard',
    icon: Home,
    path: '/',
    permission: null,  // All users
  },
  {
    label: 'New Transaction',
    icon: ShoppingCart,
    path: '/transaction',
    permission: Permission.TRANSACTION_CREATE,
  },
  {
    label: 'Customers',
    icon: Users,
    path: '/customers',
    permission: Permission.CUSTOMER_VIEW,
  },
  {
    label: 'Orders',
    icon: Package,
    path: '/orders',
    permission: Permission.ORDER_VIEW,
  },
  {
    label: 'Reports',
    icon: BarChart,
    path: '/reports',
    permission: Permission.ADMIN_REPORTS,
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    permission: Permission.ADMIN_SETTINGS,
  },
];
```

### 3.3 Header Component

**Files:**
- CREATE: `apps/pos-web/src/shared/layouts/Header.tsx`
- CREATE: `apps/pos-web/src/shared/layouts/UserMenu.tsx`
- CREATE: `apps/pos-web/src/shared/layouts/StoreIndicator.tsx`

**Implementation:**
- Store number and name
- User name and role
- Logout option
- Notification bell (future)
- Command palette trigger (Cmd+K)

### 3.4 Command Palette

**Files:**
- CREATE: `apps/pos-web/src/shared/components/CommandPalette.tsx`

**Implementation:**
```typescript
// Quick actions:
// - New transaction
// - Find customer (by name/email/phone)
// - Find order (by order number)
// - SKU lookup
// - Keyboard shortcut reference
```

---

## Phase 4: Router Configuration

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Router Setup

**Files:**
- CREATE: `apps/pos-web/src/app/router.tsx`
- CREATE: `apps/pos-web/src/app/routes/__root.tsx`
- CREATE: `apps/pos-web/src/app/routes/index.tsx`
- CREATE: `apps/pos-web/src/app/routes/login.tsx`

**Implementation:**
```typescript
const routeTree = rootRoute.addChildren([
  // Public routes
  loginRoute,

  // Protected routes (require auth)
  indexRoute,                    // Dashboard
  transactionRoute.addChildren([
    transactionIndexRoute,       // New transaction
    transactionCartRoute,        // Cart view
    transactionCheckoutRoute,    // Checkout flow
  ]),
  customersRoute.addChildren([
    customersIndexRoute,         // Customer list/search
    customerDetailRoute,         // Customer detail
    customerCreateRoute,         // Create customer
    customerEditRoute,           // Edit customer
  ]),
  ordersRoute.addChildren([
    ordersIndexRoute,            // Order list/search
    orderDetailRoute,            // Order detail
  ]),
  reportsRoute,                  // Reports (manager+)
  settingsRoute,                 // Settings (admin)
]);
```

### 4.2 Route Guards

**Files:**
- MODIFY: `apps/pos-web/src/app/routes/__root.tsx`

**Implementation:**
```typescript
// Root route redirects to login if not authenticated
// Protected routes check permissions before rendering
```

---

## Phase 5: Dashboard Home

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Dashboard Page

**Files:**
- CREATE: `apps/pos-web/src/features/dashboard/pages/DashboardPage.tsx`

**Implementation:**
```typescript
// Dashboard sections:
// 1. Quick Actions (large buttons for common tasks)
// 2. Today's Metrics (transactions, sales, returns)
// 3. Recent Activity (last 5 transactions)
// 4. Alerts/Notifications (system messages)
```

### 5.2 Quick Actions Component

**Files:**
- CREATE: `apps/pos-web/src/features/dashboard/components/QuickActions.tsx`

**Implementation:**
```typescript
// Actions based on role:
// - New Transaction (all)
// - Find Customer (all)
// - View Orders (all with permission)
// - Apply Return (supervisor+)
// - Manager Override (manager+)
// - Reports (manager+)
```

### 5.3 Metrics Cards

**Files:**
- CREATE: `apps/pos-web/src/features/dashboard/components/MetricsCards.tsx`
- CREATE: `apps/pos-web/src/features/dashboard/hooks/useDashboardMetrics.ts`

**Implementation:**
```typescript
interface DashboardMetrics {
  todayTransactions: number;
  todaySales: number;
  todayReturns: number;
  averageTransactionValue: number;
  conversionRate?: number;  // For B2B
}

// Cards showing:
// - Transactions today (with trend)
// - Sales total (with goal progress)
// - Returns (with percentage)
// - Average transaction value
```

### 5.4 Recent Activity

**Files:**
- CREATE: `apps/pos-web/src/features/dashboard/components/RecentActivity.tsx`

**Implementation:**
```typescript
// List of recent transactions:
// - Transaction ID
// - Customer name (or Guest)
// - Amount
// - Time
// - Status
// Click to view details
```

---

## Phase 6: App Entry & Providers

**Prereqs:** All phases complete
**Blockers:** None

### 6.1 Main Entry Point

**Files:**
- CREATE: `apps/pos-web/src/main.tsx`

### 6.2 App Component

**Files:**
- CREATE: `apps/pos-web/src/app/App.tsx`
- CREATE: `apps/pos-web/src/app/providers.tsx`

**Implementation:**
```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/pos-web/project.json` | Nx project config |
| CREATE | `apps/pos-web/vite.config.ts` | Vite build config |
| CREATE | `apps/pos-web/src/main.tsx` | Entry point |
| CREATE | `apps/pos-web/src/app/App.tsx` | Root component |
| CREATE | `apps/pos-web/src/app/providers.tsx` | Context providers |
| CREATE | `apps/pos-web/src/app/router.tsx` | TanStack Router |
| CREATE | `apps/pos-web/src/features/auth/` | Auth system |
| CREATE | `apps/pos-web/src/shared/layouts/` | Main layouts |
| CREATE | `apps/pos-web/src/features/dashboard/` | Dashboard |
| MODIFY | `docker/docker-compose.yml` | Add pos-web service |
| MODIFY | `CLAUDE.md` | Add pos-web to apps |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add pos-web to Applications table (port 3003) |
| `apps/pos-web/README.md` | Document POS setup and usage |
| `apps/pos-web/AGENTS.md` | AI guidance for POS development |

---

## Checklist

- [ ] Phase 1: App scaffolded
- [ ] Phase 2: Auth system complete
- [ ] Phase 3: Layout and navigation working
- [ ] Phase 4: Router configured
- [ ] Phase 5: Dashboard functional
- [ ] Phase 6: Entry points configured
- [ ] Documentation updated
