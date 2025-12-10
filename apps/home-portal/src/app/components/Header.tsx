import { Button } from '@reactive-platform/shared-ui/ui-components';

export function Header() {
  const handleLogin = () => {
    // Placeholder - will be implemented with authentication
    console.log('Login clicked');
  };

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-2xl text-primary-foreground">
            🚀
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight text-foreground">
              Reactive Platform
            </h1>
            <p className="text-xs text-muted-foreground">Application Portal</p>
          </div>
        </div>

        {/* Search Bar (Center) */}
        <div className="hidden flex-1 max-w-xl mx-8 md:block">
          <div className="relative">
            <input
              type="search"
              placeholder="Search applications..."
              className="w-full rounded-lg border border-input bg-background px-4 py-2 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Login/Logout Button */}
        <div className="flex items-center gap-2">
          <Button onClick={handleLogin} variant="outline" size="sm">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Login
          </Button>
        </div>
      </div>
    </header>
  );
}
