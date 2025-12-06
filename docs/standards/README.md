# Platform Standards

Standards for building applications on this platform, designed for **both humans and AI agents**.

## Philosophy

These standards convey:
- **Intent** - Why we do things this way
- **Outcomes** - What success looks like
- **Patterns** - Pseudo-code and data structures (not implementation code)

Implementation details live in the modules themselves (README.md files alongside code).

## How to Use

1. **Before implementing a feature**, read the relevant standard
2. **Follow the patterns** described in each standard
3. **Reference implementation** lives in application directories

## Standards by Ecosystem

### Shared Standards (All Ecosystems)

| Standard | Description |
|----------|-------------|
| [code-style.md](./code-style.md) | Formatting, naming conventions |
| [documentation.md](./documentation.md) | README, AGENTS, CONTENTS file patterns |

### Backend Standards (Spring/Gradle)

See [backend/README.md](./backend/README.md) for the full list of 16 backend standards covering:
- Architecture and models
- Resilience (circuit breakers, retries, bulkheads, timeouts)
- Caching and observability
- Security, error handling, and validation
- Testing (unit, integration, e2e)

### Frontend Standards (Nx/React/Vite)

See [frontend/README.md](./frontend/README.md) for frontend standards covering:
- Architecture and components
- Error handling and observability
- Testing and state management
- Code organization

## Creating a New Standard

1. Determine ecosystem: shared, `backend/`, or `frontend/`
2. Create the file in the appropriate directory
3. Follow this structure:
   - **Intent** - Why this standard exists
   - **Outcomes** - What following it achieves
   - **Patterns** - Pseudo-code, data structures, diagrams
   - **Anti-patterns** - What to avoid
   - **Reference** - Where to see it in action
4. Add to the directory's README.md index
5. Update CONTENTS.md
