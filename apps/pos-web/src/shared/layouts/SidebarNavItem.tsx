import { NavLink } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@reactive-platform/shared-ui-components';

interface SidebarNavItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
}

export function SidebarNavItem({ label, path, icon: Icon, badge }: SidebarNavItemProps) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-muted text-primary'
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
