# service

## Purpose
Business logic for user management and JWT token generation.

## Behavior
Orchestrates user operations including creation, updates, password hashing, and generates signed JWT tokens with user claims and permissions.

## Quirks
- JWT tokens signed with RS256 algorithm using JWK source
- Passwords hashed with bcrypt before storage
