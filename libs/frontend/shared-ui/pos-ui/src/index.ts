// Transaction components
export { TransactionHeader } from "./components/TransactionHeader/TransactionHeader";
export type {
  TransactionHeaderProps,
  TransactionStatus,
  CustomerSummary,
} from "./components/TransactionHeader/TransactionHeader";

// Line item components
export { LineItemRow } from "./components/LineItemRow/LineItemRow";
export type {
  LineItemRowProps,
  LineItem,
  MarkdownInfo,
} from "./components/LineItemRow/LineItemRow";

// Dialog components
export { MarkdownDialog } from "./components/MarkdownDialog/MarkdownDialog";
export type {
  MarkdownDialogProps,
  MarkdownInput,
  MarkdownType,
  MarkdownReason,
  MarkdownPermissionTier,
  MarkdownLimit,
} from "./components/MarkdownDialog/MarkdownDialog";

// Utility functions
export {
  formatCurrency,
  formatMarkdown,
  calculateLineItemTotal,
} from "./utils/formatting";
