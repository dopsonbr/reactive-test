import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@reactive-platform/shared-ui-components';
import { useAuth } from '../context/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const TEST_USERS = [
  {
    username: 'admin',
    description: 'Full access to all services',
    scopes: ['product:read', 'product:write', 'cart:read', 'cart:write', 'checkout:read', 'checkout:write', 'order:read', 'order:write'],
  },
  {
    username: 'customer',
    description: 'Standard customer access',
    scopes: ['product:read', 'cart:read', 'cart:write', 'checkout:write', 'order:read'],
  },
  {
    username: 'readonly',
    description: 'Read-only access to products',
    scopes: ['product:read'],
  },
];

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleLogin = async (username: string) => {
    setError(null);
    try {
      await login(username);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

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
          <h2 className="text-lg font-semibold">Login as Test User</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Select a test user to authenticate. This is for Docker testing only.
        </p>

        {error && (
          <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {TEST_USERS.map((user) => (
            <button
              key={user.username}
              onClick={() => handleLogin(user.username)}
              disabled={isLoading}
              className="w-full rounded-lg border p-4 text-left hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{user.username}</span>
                <span className="text-xs text-muted-foreground">
                  {user.scopes.length} scopes
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {user.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {user.scopes.slice(0, 4).map((scope) => (
                  <span
                    key={scope}
                    className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {scope}
                  </span>
                ))}
                {user.scopes.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{user.scopes.length - 4} more
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

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
