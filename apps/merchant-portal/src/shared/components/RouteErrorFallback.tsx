import { useNavigate } from '@tanstack/react-router';

interface Props {
  error?: Error;
  resetError?: () => void;
}

export function RouteErrorFallback({ error, resetError }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-destructive">Page Error</h1>
        <p className="mb-6 text-muted-foreground">
          {error?.message || 'This page encountered an error'}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate({ to: '/' })}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Go to Dashboard
          </button>
          {resetError && (
            <button
              onClick={resetError}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
