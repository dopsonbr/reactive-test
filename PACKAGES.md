# Package Index

## org.example.reactivetest

| Package | Purpose |
|---------|---------|
| [cache](src/main/java/org/example/reactivetest/cache/) | Non-blocking Redis caching with cache-aside and fallback patterns |
| [config](src/main/java/org/example/reactivetest/config/) | WebClient, Redis, and cache configuration |
| [context](src/main/java/org/example/reactivetest/context/) | Request metadata structure and Reactor Context keys |
| [controller](src/main/java/org/example/reactivetest/controller/) | REST endpoints with input validation and context setup |
| [domain](src/main/java/org/example/reactivetest/domain/) | Immutable business entities aggregated from services |
| [error](src/main/java/org/example/reactivetest/error/) | Global error handling with Resilience4j exception mapping |
| [logging](src/main/java/org/example/reactivetest/logging/) | Structured JSON logging with Reactor Context propagation |
| [repository](src/main/java/org/example/reactivetest/repository/) | Reactive HTTP clients with resilience and caching |
| [resilience](src/main/java/org/example/reactivetest/resilience/) | Resilience4j decorator wrapper for reactive streams |
| [service](src/main/java/org/example/reactivetest/service/) | Business logic orchestration with parallel repository calls |

## Documentation Structure

Each package contains:
- **README.md** - Purpose, behavior, and quirks
- **CONTENTS.md** - File listing with descriptions
- **AGENTS.md** - Operational boundaries and conventions
