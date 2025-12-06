# graphql.input

## Boundaries
Files that require careful review before changes: all (must match schema.graphqls input types)

## Conventions
- All input types are Java records for immutability
- Optional fields use nullable wrapper types (Integer, String)
- Default value methods named `{field}OrDefault()` for pagination parameters
- No validation annotations - validation handled at resolver layer

## Warnings
- Changing field names or types breaks GraphQL schema compatibility
- `limitOrDefault()` caps at 100 to prevent unbounded queries
