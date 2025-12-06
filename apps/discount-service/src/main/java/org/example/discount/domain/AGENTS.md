# domain

## Boundaries

Files that require careful review before changes:
- `UserContext.java` - permission model affects all markdown operations
- `LoyaltyInfo.java` - benefit structure affects pricing calculations

## Conventions

- UserContext.anonymous() provides default non-employee context
- UserContext.canApplyMarkdown() requires EMPLOYEE type and ADMIN permission
- LoyaltyInfo tiers: NONE, BRONZE, SILVER, GOLD, PLATINUM
- LoyaltyBenefit types: PERCENTAGE_DISCOUNT, FREE_SHIPPING

## Warnings

- UserContext comes from external user-service (may be unavailable)
- LoyaltyInfo comes from external customer-service (may be unavailable)
- Permission.ADMIN is required for markdowns, not just EMPLOYEE type
