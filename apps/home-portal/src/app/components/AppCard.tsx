import { Application } from '../types';
import { Badge } from '@reactive-platform/shared-ui/ui-components';

interface AppCardProps {
  application: Application;
  onNavigate: (app: Application) => void;
}

export function AppCard({ application, onNavigate }: AppCardProps) {
  const handleClick = () => {
    onNavigate(application);
  };

  const isActive = application.status === 'active';

  return (
    <button
      onClick={handleClick}
      className={`group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all duration-200 hover:shadow-lg ${
        isActive
          ? 'hover:border-primary hover:bg-accent/50 cursor-pointer'
          : 'cursor-not-allowed opacity-75'
      }`}
      aria-label={`${application.title} - ${application.status === 'active' ? 'Click to open' : 'Coming soon'}`}
    >
      {/* Icon */}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-lg text-4xl transition-transform duration-200 ${
          isActive
            ? 'bg-primary/10 group-hover:scale-110'
            : 'bg-muted'
        }`}
      >
        {application.icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg text-card-foreground leading-tight">
            {application.title}
          </h3>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className="shrink-0"
          >
            {isActive ? 'Active' : 'Coming Soon'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {application.description}
        </p>
      </div>

      {/* Hover indicator for active apps */}
      {isActive && (
        <div className="flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span>Open application</span>
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
