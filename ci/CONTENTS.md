# Contents

## Node.js Scripts (Recommended)

| File | Description |
|------|-------------|
| `verify.js` | Pre-merge verification: format + build + arch + test + bootJar |
| `format-check.js` | Checks code formatting with Spotless (Google Java Format) |
| `format-apply.js` | Applies code formatting with Spotless |
| `arch-check.js` | Runs architecture tests with ArchUnit |
| `build-all.js` | Builds all modules using `./gradlew buildAll` |
| `build-bootjars.js` | Builds bootable JARs for product-service and cart-service |
| `test-unit.js` | Runs all unit tests using `./gradlew testAll` |
| `package.json` | Node.js package config with npm scripts |

## Node.js Libraries

| File | Description |
|------|-------------|
| `lib/logger.js` | Structured logging with colors, icons, and formatting |
| `lib/gradle.js` | Gradle execution utilities and output parsing |

## Bash Scripts

| File | Description |
|------|-------------|
| `verify.sh` | Pre-merge verification: format + build + arch + test + bootJar |
| `format-check.sh` | Checks code formatting with Spotless (Google Java Format) |
| `format-apply.sh` | Applies code formatting with Spotless |
| `arch-check.sh` | Runs architecture tests with ArchUnit |
| `build-all.sh` | Builds all modules using `./gradlew buildAll` |
| `build-bootjars.sh` | Builds bootable JARs for product-service and cart-service |
| `test-unit.sh` | Runs all unit tests using `./gradlew testAll` |

## Docker & E2E Scripts

| File | Description |
|------|-------------|
| `docker-up.sh` | Starts Docker Compose stack (observability + services) |
| `docker-down.sh` | Stops Docker Compose stack and removes volumes |
| `e2e-load-test.sh` | Runs k6 load test (auto-starts Docker stack if needed) |
| `e2e-resilience-test.sh` | Runs k6 resilience test (auto-starts Docker stack if needed) |
| `e2e-circuit-breaker-test.sh` | Runs k6 circuit breaker test (auto-starts Docker stack if needed) |
| `e2e-oauth-chaos-test.sh` | Runs OAuth chaos test |
| `e2e-oauth-circuit-breaker-test.sh` | Runs OAuth circuit breaker test |
| `_ensure-docker-stack.sh` | Helper: checks Docker stack status and starts if needed |
