export interface MarkdownInfo {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'OVERRIDE_PRICE';
  value: number;
  reason: string;
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a markdown for display
 */
export function formatMarkdown(markdown: MarkdownInfo): string {
  switch (markdown.type) {
    case 'PERCENTAGE':
      return `-${markdown.value}%`;
    case 'FIXED_AMOUNT':
      return `-${formatCurrency(markdown.value)}`;
    case 'OVERRIDE_PRICE':
      return `Override: ${formatCurrency(markdown.value)}`;
  }
}

/**
 * Calculate line total from item details
 */
export function calculateLineItemTotal(
  quantity: number,
  unitPrice: number,
  discountPerItem: number
): number {
  return quantity * (unitPrice - discountPerItem);
}
