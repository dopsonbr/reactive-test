import { Store } from 'lucide-react';
import { useAuth } from '../../features/auth';

export function StoreIndicator() {
  const { storeNumber } = useAuth();

  if (!storeNumber) return null;

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
      <Store className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">Store #{storeNumber}</span>
    </div>
  );
}
