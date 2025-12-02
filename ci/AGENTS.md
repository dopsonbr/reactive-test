# CI Scripts

## Boundaries
Files that require careful review before changes:
- `verify.sh` (defines what checks are required before merging)
- `docker-up.sh` (health check logic affects CI reliability)

## Conventions
- All scripts must be executable from the repository root directory
- All scripts support `--ci` flag for CI pipeline execution
- Local mode is the default; CI mode is opt-in
- Scripts use `set -euo pipefail` for strict error handling
- All scripts determine ROOT_DIR relative to SCRIPT_DIR for portability
- Exit code 0 indicates success; non-zero indicates failure

## Warnings
- Do not add scripts that require interactive input (CI mode must be non-interactive)
- Do not modify verify.sh checks without team consensus
- Docker e2e tests require the stack to be running first (`docker-up.sh`)
- CI mode uses reduced load test parameters to keep pipeline duration reasonable
- `docker-down.sh` removes volumes; data is not persisted between runs

## Script Dependencies

```
verify.sh
├── build-all.sh
├── test-unit.sh
└── build-bootjars.sh

e2e-* scripts
├── docker-up.sh (prerequisite)
└── docker-down.sh (cleanup)
```

## Adding New Scripts
1. Create script with `#!/usr/bin/env bash` shebang
2. Add `set -euo pipefail` for strict mode
3. Support `--ci` flag with appropriate behavior differences
4. Make executable: `chmod +x ci/new-script.sh`
5. Update CONTENTS.md with script description
6. Consider if verify.sh should include the new check
