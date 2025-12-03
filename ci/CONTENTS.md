# Contents

| File | Description |
|------|-------------|
| `build-all.sh` | Builds all modules using `./gradlew buildAll` |
| `build-bootjars.sh` | Builds bootable JARs for product-service and cart-service |
| `test-unit.sh` | Runs all unit tests using `./gradlew testAll` |
| `format-check.sh` | Checks code formatting with Spotless (Google Java Format) |
| `format-apply.sh` | Applies code formatting with Spotless |
| `arch-check.sh` | Runs architecture tests with ArchUnit |
| `verify.sh` | Pre-merge verification: format + build + arch + test + bootJar |
| `docker-up.sh` | Starts Docker Compose stack (observability + services) |
| `docker-down.sh` | Stops Docker Compose stack and removes volumes |
| `e2e-load-test.sh` | Runs k6 load test (auto-starts Docker stack if needed) |
| `e2e-resilience-test.sh` | Runs k6 resilience test (auto-starts Docker stack if needed) |
| `e2e-circuit-breaker-test.sh` | Runs k6 circuit breaker test (auto-starts Docker stack if needed) |
| `_ensure-docker-stack.sh` | Helper: checks Docker stack status and starts if needed |
