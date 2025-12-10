# Platform Error

## Boundaries

Files that require careful review before changes:
- `GlobalErrorHandler.java` - Changes affect all applications using this library
- `ErrorResponse.java` - Changes affect client contract for all consumers

## Conventions

- All exceptions handled by GlobalErrorHandler map to ErrorResponse format
- Trace ID extracted from OpenTelemetry span for correlation
- Stack traces never exposed to clients
- ValidationException uses `List<ValidationError>` for field-level errors
- Resilience4j exceptions map to 503/504 status codes
- WebClientResponseException mirrors upstream status code

## Warnings

- Do not add business logic to GlobalErrorHandler; it should only map exceptions to responses
- Spring Security dependencies are compileOnly; handler gracefully handles absence
- Exception handlers log at appropriate levels: warn for expected errors, error for unexpected
- Adding new exception handlers requires coordination with all consuming applications
