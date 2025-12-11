import { Tag, Percent, DollarSign, XCircle } from 'lucide-react';
import type { MarkdownInfo } from '../../types/markdown';
import { MARKDOWN_REASON_LABELS } from '../../types/markdown';
import {
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@reactive-platform/shared-ui-components';

interface MarkdownIndicatorProps {
  markdown: MarkdownInfo;
  onRemove?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function MarkdownIndicator({
  markdown,
  onRemove,
  showDetails = false,
  className,
}: MarkdownIndicatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getIcon = () => {
    switch (markdown.type) {
      case 'PERCENTAGE':
        return <Percent className="h-3 w-3" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="h-3 w-3" />;
      case 'OVERRIDE_PRICE':
        return <Tag className="h-3 w-3" />;
    }
  };

  const getDisplayValue = () => {
    switch (markdown.type) {
      case 'PERCENTAGE':
        return `${markdown.value}% off`;
      case 'FIXED_AMOUNT':
        return `${formatCurrency(markdown.value)} off`;
      case 'OVERRIDE_PRICE':
        return `Price: ${formatCurrency(markdown.value)}`;
    }
  };

  const content = (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 text-green-700 bg-green-100 hover:bg-green-200',
        className
      )}
    >
      {getIcon()}
      <span>{getDisplayValue()}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1 hover:bg-red-200 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <XCircle className="h-3 w-3" />
          <span className="sr-only">Remove markdown</span>
        </Button>
      )}
    </Badge>
  );

  if (showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p className="font-medium">{MARKDOWN_REASON_LABELS[markdown.reason]}</p>
            {markdown.notes && <p className="text-muted-foreground">{markdown.notes}</p>}
            <p className="text-muted-foreground">
              By: {markdown.appliedBy} at {new Date(markdown.appliedAt).toLocaleTimeString()}
            </p>
            {markdown.overrideAuthorizedBy && (
              <p className="text-amber-600">
                Override by: {markdown.overrideAuthorizedBy}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
