# Frontend Architecture Standard

## Intent

Define consistent component layering and code organization across React applications.

## Outcomes

- Clear separation between smart and presentational components
- Predictable feature folder structure
- Consistent data flow patterns

## Patterns

### Feature Folder Structure

```
src/features/{domain}/
├── api/          # TanStack Query hooks
├── components/   # Feature-specific components
├── hooks/        # Custom hooks
├── pages/        # Route components
└── types/        # TypeScript types
```

### Component Layering

```
Page → Feature Component → UI Component
         ↓                    ↓
    TanStack Query         Props only
```

- **Page**: Thin orchestrator, composes feature components, handles routing
- **Feature Component**: Smart component, owns data fetching via TanStack Query
- **UI Component**: Presentational, receives props, no data awareness

### State Boundaries

| State Type | Location | Example |
|------------|----------|---------|
| URL state | TanStack Router | Navigation, filters, pagination |
| Server state | TanStack Query | API data, cached responses |
| Local state | useState | Ephemeral UI (modals, hover) |

### Import Hierarchy

```
apps/{app}/           → can import from libs/*
libs/feature-*        → can import from libs/ui, libs/data-access, libs/util
libs/ui               → can import from libs/util
libs/data-access      → can import from libs/util
libs/util             → standalone, no internal imports
```

## Anti-patterns

- **Barrel exports causing bundle bloat** - Avoid `export * from` in large packages
- **Circular feature dependencies** - Features should not import from each other
- **Business logic in UI components** - Keep libs/ui pure presentational
- **Prop drilling >2 levels** - Use composition or context

## Reference

- ADR-007: Frontend UI Framework
- `apps/ecommerce-web/` for reference implementation
