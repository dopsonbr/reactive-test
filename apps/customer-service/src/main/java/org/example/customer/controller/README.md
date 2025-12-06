# controller

## Purpose

REST controller for customer operations including CRUD, search, and B2B hierarchy management.

## Behavior

Exposes endpoints for customer lifecycle (create, read, update, delete), multi-criteria search, and B2B sub-account operations. Validates requests, establishes Reactor Context, and delegates to CustomerService.

## Quirks

- Search accepts mutually exclusive criteria (customerId, email, or phone)
- Sub-account endpoints only work for BUSINESS type customers
- Email uniqueness is enforced per store, not globally
