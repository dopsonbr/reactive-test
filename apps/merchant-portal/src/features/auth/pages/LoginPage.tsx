import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@reactive-platform/shared-ui-components';
import { useAuth, DEV_TEST_USERS } from '../index';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (username: string) => {
    setError(null);
    try {
      await login(username);
      navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8">
        <div>
          <h1 className="text-2xl font-bold">Merchant Portal</h1>
          <p className="text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {DEV_TEST_USERS.map((user) => (
            <button
              key={user.username}
              onClick={() => handleLogin(user.username)}
              disabled={isLoading}
              className="w-full rounded-lg border p-4 text-left hover:bg-muted disabled:opacity-50"
            >
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-muted-foreground">{user.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {user.permissions.map((perm) => (
                  <span key={perm} className="rounded bg-primary/10 px-2 py-0.5 text-xs">
                    {perm}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
