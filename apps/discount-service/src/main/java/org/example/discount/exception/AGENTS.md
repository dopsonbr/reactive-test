# exception

## Boundaries

Files that require careful review before changes: none

## Conventions

- InvalidDiscountException maps to 404 in DiscountController
- UnauthorizedMarkdownException maps to 403 in MarkdownController
- Both extend RuntimeException for reactive error handling

## Warnings

- Do not catch these exceptions in service layer; let controllers handle HTTP mapping
