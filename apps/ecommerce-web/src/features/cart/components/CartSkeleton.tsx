import { Card, CardContent, CardFooter, CardHeader } from '@reactive-platform/shared-ui-components';

function CartItemSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-24 w-24 rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-8 bg-muted rounded w-32 mt-auto" />
        </div>
      </div>
    </Card>
  );
}

function SummarySkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
        <hr />
        <div className="flex justify-between">
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-20" />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <div className="h-12 bg-muted rounded w-full" />
        <div className="h-10 bg-muted rounded w-full" />
      </CardFooter>
    </Card>
  );
}

export function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-muted rounded w-32 mb-6 animate-pulse" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-4">
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>
        <aside className="w-full lg:w-80">
          <SummarySkeleton />
        </aside>
      </div>
    </div>
  );
}
