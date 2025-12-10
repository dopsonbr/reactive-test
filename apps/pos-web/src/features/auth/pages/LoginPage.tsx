import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@reactive-platform/shared-ui-components';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [storeNumber, setStoreNumber] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ASSOCIATE);
  const [error, setError] = useState('');

  const from = (location.state as LocationState)?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    const store = parseInt(storeNumber, 10);
    if (isNaN(store) || store < 1 || store > 2000) {
      setError('Store number must be between 1 and 2000');
      return;
    }

    try {
      await login(username.trim(), store, role);
      navigate(from, { replace: true });
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">POS Login</CardTitle>
          <CardDescription>Sign in to access the point of sale system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeNumber">Store Number</Label>
              <Input
                id="storeNumber"
                type="number"
                placeholder="1-2000"
                min={1}
                max={2000}
                value={storeNumber}
                onChange={(e) => setStoreNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ASSOCIATE}>Associate</SelectItem>
                  <SelectItem value={UserRole.SUPERVISOR}>Supervisor</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.CONTACT_CENTER}>Contact Center</SelectItem>
                  <SelectItem value={UserRole.B2B_SALES}>B2B Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Development Mode</p>
            <p className="mt-1">Use any username to sign in</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
