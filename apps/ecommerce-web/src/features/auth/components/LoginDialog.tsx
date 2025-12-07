import { useState } from 'react';
import { X, ShoppingCart, Briefcase, Monitor, LogIn } from 'lucide-react';
import { Button } from '@reactive-platform/shared-ui-components';
import { useAuth } from '../context/AuthContext';
import { DEV_TEST_USERS, TestUser, UserType } from '../config';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const USER_TYPE_ICONS: Record<UserType, typeof ShoppingCart> = {
  EMPLOYEE: Briefcase,
  CUSTOMER: ShoppingCart,
  SERVICE_ACCOUNT: Monitor,
};

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { loginDev, loginOAuth, authConfig, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleDevLogin = async (user: TestUser) => {
    setError(null);
    try {
      await loginDev(user.username, user.userType, user.storeNumber);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleOAuthLogin = () => {
    loginOAuth();
  };

  const isDevMode = authConfig.mode === 'dev';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isDevMode ? 'Login as Test User' : 'Login'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isDevMode ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Select a test user to authenticate. This is for local/Docker testing only.
            </p>

            {error && (
              <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {DEV_TEST_USERS.map((user) => {
                const Icon = USER_TYPE_ICONS[user.userType] || ShoppingCart;
                return (
                  <button
                    key={user.username}
                    onClick={() => handleDevLogin(user)}
                    disabled={isLoading}
                    className="w-full rounded-lg border p-4 text-left hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{user.username}</span>
                          <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                            {user.userType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {user.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        >
                          {permission}
                        </span>
                      ))}
                      {user.storeNumber && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Store #{user.storeNumber}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Click below to sign in with your account.
            </p>

            {error && (
              <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={handleOAuthLogin}
              className="w-full"
              disabled={isLoading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign in with OAuth
            </Button>
          </>
        )}

        <div className="mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
