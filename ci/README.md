# CI Scripts

## Purpose
Collection of shell scripts for building, testing, and verifying the project. All scripts support both local development (default) and CI pipeline execution via the `--ci` flag.

## Quick Start

```bash
# Build everything
./ci/build-all.sh

# Run unit tests
./ci/test-unit.sh

# Pre-merge verification (build + test + bootJar)
./ci/verify.sh
```

## Scripts

| Script | Description |
|--------|-------------|
| `build-all.sh` | Build all modules (platform libraries + applications) |
| `build-bootjars.sh` | Build bootable JARs for Docker deployment |
| `test-unit.sh` | Run all unit tests |
| `verify.sh` | Pre-merge verification (build + test + bootJar) |
| `docker-up.sh` | Start Docker Compose observability stack |
| `docker-down.sh` | Stop Docker Compose stack and clean volumes |
| `e2e-load-test.sh` | Run k6 load test (auto-starts Docker stack) |
| `e2e-resilience-test.sh` | Run k6 resilience/chaos test (auto-starts Docker stack) |
| `e2e-circuit-breaker-test.sh` | Run k6 circuit breaker test (auto-starts Docker stack) |

## Modes

### Local Mode (default)
- Uses Gradle daemon for faster builds
- Rich console output with progress indicators
- Interactive Docker output
- Full load test parameters (50 VUs, 10000 iterations)

### CI Mode (`--ci` flag)
- No Gradle daemon (`--no-daemon`)
- Plain console output for log parsing
- Quiet Docker pulls, health check waits
- Reduced load test parameters (10 VUs, 100 iterations)

## Usage Examples

```bash
# Local development
./ci/build-all.sh
./ci/test-unit.sh
./ci/verify.sh

# CI pipeline
./ci/build-all.sh --ci
./ci/test-unit.sh --ci
./ci/verify.sh --ci

# E2E testing (auto-starts Docker stack if needed)
./ci/e2e-load-test.sh --vus 100 --iterations 5000
./ci/e2e-resilience-test.sh
./ci/e2e-circuit-breaker-test.sh
./ci/docker-down.sh  # cleanup when done
```

## Workflow: Before Merging

Run the verification script to ensure code is ready:

```bash
./ci/verify.sh
```

This runs:
1. `build-all.sh` - Compile all modules
2. `test-unit.sh` - Run all unit tests
3. `build-bootjars.sh` - Verify applications can be packaged
