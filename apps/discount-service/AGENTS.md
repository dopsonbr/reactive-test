# Discount Service Agent Guidelines

Discount pricing engine with three distinct APIs: promo code validation, employee markdown authorization, and comprehensive cart pricing with loyalty.

## Boundaries

Files that require careful review before changes:

| File | Reason |
|------|--------|
| `PricingService.java` | Complex discount stacking logic affects all pricing calculations |
| `MarkdownService.java` | Employee authorization and 4-hour session expiry logic |
| `DiscountRequestValidator.java` | Request validation rules affect all endpoints |
| `UserContext.java` | Permission model affects markdown authorization |
| `LoyaltyInfo.java` | Loyalty tier benefit structure |

## Conventions

- Markdown authorization requires both UserType.EMPLOYEE and Permission.ADMIN
- Stackable discounts sum; non-stackable uses best single discount; never both
- Loyalty applies first, then promo codes
- All markdowns expire 4 hours after appliedAt timestamp
- In-memory repositories for development (production needs persistence)
- Request validation collects all errors before throwing

## Warnings

- Do not modify stacking rules without pricing team review
- Markdown expiry is session-based (4-hour window from appliedAt)
- UserContext comes from external user-service (may be unavailable)
- LoyaltyInfo comes from external customer-service (may be unavailable)
- In-memory repositories lose data on restart
- Invalid promo codes return 404, unauthorized markdowns return 403
