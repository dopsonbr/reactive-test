import { X } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { StoreIndicator } from './StoreIndicator';
import { Button, cn } from '@reactive-platform/shared-ui-components';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <span className="text-lg font-semibold">POS System</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Desktop header */}
        <div className="hidden h-14 items-center border-b px-4 lg:flex">
          <span className="text-lg font-semibold">POS System</span>
        </div>

        {/* Store indicator on mobile */}
        <div className="border-b px-4 py-3 md:hidden">
          <StoreIndicator />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav />
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            v1.0.0 • Help: F1
          </p>
        </div>
      </aside>
    </>
  );
}
