# CI Scripts

## Boundaries

Files that require careful review before changes:

- `verify.js` / `verify.sh` - Defines what checks are required before merging
- `lib/logger.js` - Logging format used by all Node.js scripts
- `lib/gradle.js` - Gradle execution logic shared by all Node.js scripts
- `docker-up.sh` - Health check logic affects CI reliability

## Conventions

### Node.js Scripts
- Use ES modules (`import`/`export`) with `"type": "module"` in package.json
- Use `.js` extension (not `.mjs`)
- All scripts support `--ci`, `--verbose`, and `--help` flags
- Use `lib/logger.js` for structured output
- Use `lib/gradle.js` for Gradle command execution
- Scripts are executable from repository root: `node ci/script.js`

### Bash Scripts
- Use `#!/usr/bin/env bash` shebang
- Use `set -euo pipefail` for strict error handling
- Support `--ci` flag for CI pipeline execution
- Determine ROOT_DIR relative to SCRIPT_DIR for portability
- Exit code 0 indicates success; non-zero indicates failure

### Both
- All scripts must work from the repository root directory
- Local mode is default; CI mode is opt-in via `--ci`
- Scripts should provide clear success/failure output

## Warnings

- Do not add scripts that require interactive input (CI mode must be non-interactive)
- Do not modify verify checks without team consensus
- Node.js scripts require Node.js >= 18.0.0
- Architecture tests only run for product-service (cart-service lacks repository layer)
- Docker e2e tests require the stack to be running first (`docker-up.sh`)
- `docker-down.sh` removes volumes; data is not persisted between runs

## Script Dependencies

```
verify.js / verify.sh
├── spotlessCheck (format)
├── buildAll
├── :apps:product-service:test --tests '*ArchitectureTest*' (arch)
├── testAll
└── bootJar (product-service, cart-service)

Node.js library dependencies:
lib/logger.js ← verify.js, format-check.js, arch-check.js, etc.
lib/gradle.js ← verify.js, format-check.js, arch-check.js, etc.

e2e-* scripts
├── docker-up.sh (prerequisite)
└── docker-down.sh (cleanup)
```

## Adding New Scripts

### Node.js Script
1. Create script with `#!/usr/bin/env node` shebang
2. Import `Logger` from `./lib/logger.js`
3. Import `runGradle`, `ROOT_DIR` from `./lib/gradle.js`
4. Support `--ci`, `--verbose`, `--help` flags
5. Add npm script to `package.json`
6. Update `CONTENTS.md` with description

### Bash Script
1. Create script with `#!/usr/bin/env bash` shebang
2. Add `set -euo pipefail` for strict mode
3. Support `--ci` flag with appropriate behavior differences
4. Make executable: `chmod +x ci/new-script.sh`
5. Update `CONTENTS.md` with description

## Common Tasks

### Modify Verification Steps
Edit the `steps` array in `verify.js`:
```javascript
const steps = [
  { label: 'Step Name', task: 'gradleTask', args: [], fixCommand: '...', docsLink: '...' },
];
```

### Add New Logger Output Format
Edit `lib/logger.js` and add method to the `Logger` class.

### Change Gradle Execution Behavior
Edit `lib/gradle.js` and modify `runGradle()` function.

### Update Architecture Tests Target
Edit `arch-check.js` and `verify.js` to change the Gradle task from `:apps:product-service:test` to include additional modules when they have ArchitectureTest.
