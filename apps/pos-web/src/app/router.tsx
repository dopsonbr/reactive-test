import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { POSLayout } from '../shared/layouts';
import {
  AuthProvider,
  LoginPage,
  UnauthorizedPage,
  ProtectedRoute,
  Permission,
} from '../features/auth';
import { DashboardPage } from '../features/dashboard';
import {
  TransactionProvider,
  TransactionPage,
  CheckoutPage,
  PaymentPage,
  CompletePage,
} from '../features/transaction';
import {
  CustomerSearchPage,
  CustomerDetailPage,
  CustomerFormPage,
} from '../features/customer';

function OrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-muted-foreground">
        Order management will be implemented in 045D_POS_TRANSACTION_FLOW.
      </p>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-muted-foreground">
        Reports will be implemented in 045F_POS_ADVANCED_FEATURES.
      </p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">
        Settings will be implemented in 045F_POS_ADVANCED_FEATURES.
      </p>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-muted-foreground">User profile settings.</p>
    </div>
  );
}

// Root layout with AuthProvider wrapper
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Protected layout wrapper
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <POSLayout />
    </ProtectedRoute>
  );
}

// Transaction layout with provider
function TransactionLayout() {
  return (
    <TransactionProvider>
      <Outlet />
    </TransactionProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
      },

      // Protected routes
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: '/',
            element: <DashboardPage />,
          },
          // Transaction routes with TransactionProvider
          {
            element: (
              <ProtectedRoute permission={Permission.TRANSACTION_CREATE}>
                <TransactionLayout />
              </ProtectedRoute>
            ),
            children: [
              {
                path: '/transaction',
                element: <TransactionPage />,
              },
              {
                path: '/transaction/checkout',
                element: <CheckoutPage />,
              },
              {
                path: '/transaction/payment',
                element: <PaymentPage />,
              },
              {
                path: '/transaction/complete',
                element: <CompletePage />,
              },
            ],
          },
          {
            path: '/customers',
            element: (
              <ProtectedRoute permission={Permission.CUSTOMER_VIEW}>
                <CustomerSearchPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/customers/new',
            element: (
              <ProtectedRoute permission={Permission.CUSTOMER_CREATE}>
                <CustomerFormPage mode="create" />
              </ProtectedRoute>
            ),
          },
          {
            path: '/customers/:customerId',
            element: (
              <ProtectedRoute permission={Permission.CUSTOMER_VIEW}>
                <CustomerDetailPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/customers/:customerId/edit',
            element: (
              <ProtectedRoute permission={Permission.CUSTOMER_EDIT}>
                <CustomerFormPage mode="edit" />
              </ProtectedRoute>
            ),
          },
          {
            path: '/orders',
            element: (
              <ProtectedRoute permission={Permission.ORDER_VIEW}>
                <OrdersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/orders/:orderId',
            element: (
              <ProtectedRoute permission={Permission.ORDER_VIEW}>
                <OrdersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/reports',
            element: (
              <ProtectedRoute permission={Permission.ADMIN_REPORTS}>
                <ReportsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/settings',
            element: (
              <ProtectedRoute permission={Permission.ADMIN_SETTINGS}>
                <SettingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
          {
            path: '/products/lookup',
            element: <TransactionPage />,
          },
          {
            path: '/override',
            element: (
              <ProtectedRoute permission={Permission.MARKDOWN_OVERRIDE}>
                <TransactionPage />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // Catch-all redirect
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
