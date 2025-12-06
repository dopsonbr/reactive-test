import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const breadcrumbVariants = cva(
  // Base styles
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BreadcrumbProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof breadcrumbVariants> {}

const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(breadcrumbVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb, breadcrumbVariants };
