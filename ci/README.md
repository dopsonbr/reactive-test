# CI Scripts

## Purpose

Collection of scripts for building, testing, and verifying the project. All scripts support both local development (default) and CI pipeline execution via the `--ci` flag.

## Quick Start

```bash
# Using Node.js scripts
node ci/verify.js           # Full pre-merge verification
node ci/format-check.js     # Check code formatting
node ci/build-all.js        # Build all modules

# Using npm scripts
cd ci && npm run verify
```

## Node.js Scripts

The Node.js scripts provide **improved logging**, **colored output**, and **comprehensive summaries**.

| Script | Description |
|--------|-------------|
| `verify.js` | Pre-merge verification (format + build + arch + test + bootJar) |
| `format-check.js` | Check code formatting with Spotless |
| `format-apply.js` | Apply code formatting with Spotless |
| `arch-check.js` | Run architecture tests with ArchUnit |
| `build-all.js` | Build all modules (platform libraries + applications) |
| `build-bootjars.js` | Build bootable JARs for Docker deployment |
| `test-unit.js` | Run all unit tests |

### npm Scripts

```bash
cd ci
npm run verify          # node verify.js
npm run format:check    # node format-check.js
npm run format:apply    # node format-apply.js
npm run arch:check      # node arch-check.js
npm run build           # node build-all.js
npm run build:bootjars  # node build-bootjars.js
npm run test            # node test-unit.js
```

### Command Line Options

All Node.js scripts support:

| Option | Description |
|--------|-------------|
| `--ci` | CI mode (no Gradle daemon, plain console output) |
| `--verbose`, `-v` | Show detailed output |
| `--help`, `-h` | Show usage information |

## Bash Scripts (Docker & E2E only)

| Script | Description |
|--------|-------------|
| `docker-up.sh` | Start Docker Compose observability stack |
| `docker-down.sh` | Stop Docker Compose stack and clean volumes |
| `e2e-load-test.sh` | Run k6 load test (auto-starts Docker stack) |
| `e2e-resilience-test.sh` | Run k6 resilience/chaos test (auto-starts Docker stack) |
| `e2e-circuit-breaker-test.sh` | Run k6 circuit breaker test (auto-starts Docker stack) |
| `e2e-oauth-chaos-test.sh` | Run k6 OAuth chaos test |
| `e2e-oauth-circuit-breaker-test.sh` | Run k6 OAuth circuit breaker test |

## Modes

### Local Mode (default)
- Uses Gradle daemon for faster builds
- Rich console output with progress indicators
- Colors and icons in terminal

### CI Mode (`--ci` flag)
- No Gradle daemon (`--no-daemon`)
- Plain console output for log parsing
- Suitable for automated pipelines

## Usage Examples

```bash
# Local development
node ci/verify.js
node ci/verify.js --verbose
node ci/format-check.js

# CI pipeline
node ci/verify.js --ci
```

## Verification Pipeline

The `verify.js` script runs 5 steps:

1. **Code Formatting** - Spotless check (Google Java Format)
2. **Build All Modules** - Compile platform libraries and applications
3. **Architecture Tests** - ArchUnit layered architecture verification
4. **Unit Tests** - All unit tests across all modules
5. **Build Boot JARs** - Package executable Spring Boot JARs

### Sample Output

```
════════════════════════════════════════════════════════════
  Verification Summary
════════════════════════════════════════════════════════════

  [PASS] Code Formatting (Spotless)        702ms
  [PASS] Build All Modules                 32.3s
  [PASS] Architecture Tests (ArchUnit)      1.9s
  [PASS] Unit Tests                        31.0s
  [PASS] Build Boot JARs                    1.3s

  ────────────────────────────────────────────────────────
  5 passed | 5 total
  Total time: 1m 7s

  ✓ All checks passed - ready to merge
```

## Workflow: Before Merging

Run the verification script to ensure code is ready:

```bash
node ci/verify.js
```

If formatting issues are found:

```bash
node ci/format-apply.js
git add -A && git commit -m "Apply code formatting"
node ci/verify.js
```

## E2E Testing

For end-to-end testing with Docker:

```bash
./ci/docker-up.sh                    # Start stack
./ci/e2e-load-test.sh                # Run load test
./ci/e2e-resilience-test.sh          # Run resilience test
./ci/e2e-circuit-breaker-test.sh     # Run circuit breaker test
./ci/docker-down.sh                  # Cleanup
```
