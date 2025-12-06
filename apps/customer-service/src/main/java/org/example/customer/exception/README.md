# exception

## Purpose

Domain exceptions for customer operations with appropriate HTTP status mappings.

## Behavior

Custom exceptions for not found (404), duplicate (409), and business rule violations (422). GlobalErrorHandler from platform-error converts these to ErrorResponse.
