# GraphQL Input

## Purpose
Defines input types for GraphQL mutation operations.

## Behavior
Provides record-based input DTOs that map directly to GraphQL mutation arguments and are validated by GraphQLInputValidator.

## Quirks
- Input types mirror REST request DTOs but use GraphQL naming conventions
- All inputs are immutable records
