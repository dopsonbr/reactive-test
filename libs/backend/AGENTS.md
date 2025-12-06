# Backend Libraries - AI Agent Guidance

## Overview

This tier contains all Java/Gradle backend libraries including platform infrastructure and shared models.

## Key Directories

- `platform/` - Cross-cutting concerns (logging, resilience, caching, error handling)
- `shared-model/` - Shared DTOs consumed by multiple services

## Gradle Dependencies

When adding backend libraries as dependencies:

```kotlin
// Platform libraries
implementation(project(":libs:backend:platform:platform-logging"))
implementation(project(":libs:backend:platform:platform-resilience"))
implementation(project(":libs:backend:platform:platform-cache"))

// Shared models
implementation(project(":libs:backend:shared-model:shared-model-product"))
```

## Adding a New Backend Library

1. Create directory under appropriate parent (`platform/` or `shared-model/`)
2. Add `build.gradle.kts` using `platform.library-conventions` plugin
3. Register in `settings.gradle.kts` with full path
4. Reference the platform BOM for dependency management

## Nested AGENTS.md Files

Each platform library has its own AGENTS.md with specific guidance. Always check:
- `platform/AGENTS.md` for overall platform guidance
- `platform/{module}/AGENTS.md` for module-specific patterns
