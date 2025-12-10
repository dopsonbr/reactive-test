import { Menu, Command } from 'lucide-react';
import { StoreIndicator } from './StoreIndicator';
import { UserMenu } from './UserMenu';
import { Button } from '@reactive-platform/shared-ui-components';

interface HeaderProps {
  onMenuClick?: () => void;
  onCommandPaletteOpen?: () => void;
}

export function Header({ onMenuClick, onCommandPaletteOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Logo / Title */}
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-lg">POS System</span>
      </div>

      {/* Store Indicator */}
      <div className="hidden md:flex">
        <StoreIndicator />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command Palette Trigger */}
      <Button
        variant="outline"
        className="hidden h-9 w-64 justify-between text-muted-foreground md:flex"
        onClick={onCommandPaletteOpen}
      >
        <div className="flex items-center gap-2">
          <Command className="h-4 w-4" />
          <span className="text-sm">Search or command...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* User Menu */}
      <UserMenu />
    </header>
  );
}
