import { Button, Card, CardContent } from '@reactive-platform/shared-ui-components';
import { AlertCircle } from 'lucide-react';

interface ErrorCardProps {
  error: Error | null;
  onRetry?: () => void;
}

export function ErrorCard({ error, onRetry }: ErrorCardProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex flex-col items-center gap-4 py-8">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
