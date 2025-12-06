import { Card, CardContent } from '@reactive-platform/shared-ui-components';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        {icon || <Package className="h-12 w-12 text-muted-foreground" />}
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
