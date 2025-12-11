import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  Search,
  BarChart3,
  Settings,
  LogOut,
  Hash,
} from 'lucide-react';
import { useAuth, Permission } from '../../features/auth';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@reactive-platform/shared-ui-components';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { hasPermission, logout } = useAuth();

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {hasPermission(Permission.TRANSACTION_CREATE) && (
            <CommandItem onSelect={() => runCommand(() => navigate('/transaction'))}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>New Transaction</span>
            </CommandItem>
          )}
          {hasPermission(Permission.CUSTOMER_VIEW) && (
            <CommandItem onSelect={() => runCommand(() => navigate('/customers'))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Find Customer</span>
            </CommandItem>
          )}
          {hasPermission(Permission.ORDER_VIEW) && (
            <CommandItem onSelect={() => runCommand(() => navigate('/orders'))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Find Order</span>
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(() => navigate('/products/lookup'))}>
            <Hash className="mr-2 h-4 w-4" />
            <span>SKU Lookup</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          {hasPermission(Permission.ADMIN_REPORTS) && (
            <CommandItem onSelect={() => runCommand(() => navigate('/reports'))}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
          )}
          {hasPermission(Permission.ADMIN_SETTINGS) && (
            <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Help">
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Search className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ?
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runCommand(handleLogout)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
