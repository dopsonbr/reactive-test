import { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@reactive-platform/shared-ui-components';
import { useAuth } from '../context/AuthContext';
import { LoginDialog } from './LoginDialog';

export function UserMenu() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-5 w-5 animate-pulse" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setShowLogin(true)}>
          <User className="mr-2 h-4 w-4" />
          Login
        </Button>
        <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />
      </>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span className="text-sm">{user?.username}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-background shadow-lg">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">
                {user?.scopes.length} permissions
              </p>
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
