# Contents

| File | Description |
|------|-------------|
| `OrderQueryController.java` | GraphQL queries for order retrieval (by ID, number, store, customer, search) |
| `OrderMutationController.java` | GraphQL mutations for status updates, fulfillment, cancellation, notes |
| `GraphQLInputValidator.java` | Non-fail-fast validation collecting all input errors before returning |
| `GraphQLExceptionResolver.java` | Exception-to-GraphQL error mapping (ValidationException, HTTP status, access denied) |
| `input/OrderSearchInput.java` | Search criteria with pagination and default values |
| `input/UpdateFulfillmentInput.java` | Fulfillment update fields (date, tracking, carrier, instructions) |
| `input/UpdateStatusInput.java` | Order status update wrapper |
