# 034: Enable Nx Lint and Format for Gradle Projects

## Overview

Integrate Java static analysis (ArchUnit) and code formatting (Spotless) into the standard Nx task model, enabling:
- `pnpm nx lint :apps:product-service` → Runs ArchUnit architecture tests
- `pnpm nx format :apps:product-service` → Applies Spotless formatting
- `pnpm nx run-many -t lint` → Runs lint across all projects (Java + TypeScript)
- `pnpm nx run-many -t format` → Formats all projects (Java + TypeScript)

## Current State

| Tool | Gradle Tasks | Nx Targets | Status |
|------|--------------|------------|--------|
| Spotless | `spotlessCheck`, `spotlessApply` | `spotlessCheck`, `spotlessApply` | Inferred but non-standard names |
| ArchUnit | (runs within `test`) | N/A | No separation from unit tests |

## Target State

| Nx Target | Java (Gradle) | TypeScript (ESLint/Prettier) |
|-----------|---------------|------------------------------|
| `lint` | ArchUnit architecture tests | ESLint |
| `format` | Spotless apply | Prettier (if configured) |
| `format:check` | Spotless check | Prettier --check |

---

## Requirements

1. **R1**: `nx lint` runs ArchUnit tests for Java projects, ESLint for TypeScript projects
2. **R2**: `nx format` applies Spotless for Java projects
3. **R3**: `nx format:check` validates formatting without modifying files
4. **R4**: All targets must be cacheable with proper inputs/outputs
5. **R5**: `nx run-many -t lint` works across polyglot projects
6. **R6**: `nx affected -t lint` correctly identifies affected projects

---

## Implementation Plan

### Phase 1: Create Dedicated ArchUnit Gradle Task

ArchUnit tests currently run as part of the standard `test` task. We need to separate them for independent execution.

#### 1.1 Add JUnit Tag to ArchUnit Tests

Update `libs/platform/platform-test/src/main/java/org/example/platform/test/architecture/ArchitectureRules.java`:

```java
import org.junit.jupiter.api.Tag;

@Tag("architecture")
public class ArchitectureRules {
    // existing code
}
```

#### 1.2 Create `archTest` Gradle Task

Update `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts`:

```kotlin
// Architecture tests task (ArchUnit)
tasks.register<Test>("archTest") {
    description = "Runs ArchUnit architecture tests"
    group = "verification"

    useJUnitPlatform {
        includeTags("architecture")
    }

    // Exclude from regular test task
    shouldRunAfter(tasks.test)
}

// Exclude architecture tests from regular test task
tasks.test {
    useJUnitPlatform {
        excludeTags("architecture")
    }
}
```

#### 1.3 Configure Nx Metadata for archTest

Add Nx configuration in Gradle DSL:

```kotlin
import dev.nx.gradle.nx

tasks.named<Test>("archTest") {
    nx {
        set("cache", true)
    }
}
```

### Phase 2: Create Gradle `lint` Task

#### 2.1 Add Combined Lint Task

Update `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts`:

```kotlin
// Lint task combining spotlessCheck + archTest
tasks.register("lint") {
    description = "Runs all linting checks (Spotless + ArchUnit)"
    group = "verification"

    dependsOn("spotlessCheck", "archTest")
}
```

#### 2.2 Configure Caching

```kotlin
tasks.named("lint") {
    nx {
        set("cache", true)
    }
}
```

### Phase 3: Create Gradle `format` Tasks

#### 3.1 Add Format Task (Alias for spotlessApply)

```kotlin
// Format task (applies formatting)
tasks.register("format") {
    description = "Applies code formatting with Spotless"
    group = "formatting"

    dependsOn("spotlessApply")
}

// Format check task (validates without modifying)
tasks.register("format-check") {
    description = "Checks code formatting without modifying files"
    group = "verification"

    dependsOn("spotlessCheck")
}
```

### Phase 4: Configure @nx/gradle Plugin

#### 4.1 Update nx.json

The @nx/gradle plugin will automatically infer the new tasks. Add targetDefaults for caching:

```json
{
  "targetDefaults": {
    "lint": {
      "cache": true
    },
    "format": {
      "cache": false
    },
    "format-check": {
      "cache": true
    },
    "archTest": {
      "cache": true
    }
  }
}
```

### Phase 5: Tag ArchUnit Tests in All Services

#### 5.1 Update Existing Architecture Test Classes

Each service with an `ArchitectureTest.java` needs the `@Tag("architecture")` annotation:

- `apps/product-service/src/test/java/org/example/product/ArchitectureTest.java`
- (Add to other services as they add ArchUnit tests)

#### 5.2 Verify Tag Inheritance

Since service tests extend `ArchitectureRules`, verify the tag is inherited or add to each subclass:

```java
@Tag("architecture")
@AnalyzeClasses(packages = "org.example.product", ...)
class ArchitectureTest extends ArchitectureRules {
```

### Phase 6: Documentation and Verification

#### 6.1 Update CLAUDE.md

Add to the Build Commands section:

```markdown
## Lint Commands (Nx)

```bash
# Lint single project
pnpm nx lint :apps:product-service

# Lint all projects
pnpm nx run-many -t lint

# Lint affected projects
pnpm nx affected -t lint
```

## Format Commands (Nx)

```bash
# Format single project
pnpm nx format :apps:product-service

# Format all projects
pnpm nx run-many -t format

# Check formatting without modifying
pnpm nx run-many -t format-check
```
```

#### 6.2 Verification Steps

```bash
# Verify lint target exists
pnpm nx show project :apps:product-service | grep lint

# Run lint on single project
pnpm nx lint :apps:product-service

# Run lint across all Java projects
pnpm nx run-many -t lint --projects=":apps:*"

# Verify format target exists
pnpm nx show project :apps:product-service | grep format

# Run format on single project
pnpm nx format :apps:product-service

# Verify caching works
pnpm nx lint :apps:product-service  # First run
pnpm nx lint :apps:product-service  # Should be cached
```

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `buildSrc/src/main/kotlin/platform.java-conventions.gradle.kts` | Modify | Add `archTest`, `lint`, `format`, `format-check` tasks |
| `libs/platform/platform-test/.../ArchitectureRules.java` | Modify | Add `@Tag("architecture")` |
| `apps/product-service/.../ArchitectureTest.java` | Modify | Add `@Tag("architecture")` |
| `nx.json` | Modify | Add targetDefaults for new targets |
| `CLAUDE.md` | Modify | Document new lint/format commands |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ArchUnit tests skip in regular `test` task | Medium | Add CI check that runs both `test` and `lint` |
| Tag inheritance doesn't work | Low | Explicitly add tag to each test class |
| Existing CI pipelines break | Medium | Update CI to run `lint` target explicitly |

---

## Success Criteria

1. [ ] `pnpm nx lint :apps:product-service` runs ArchUnit tests successfully
2. [ ] `pnpm nx format :apps:product-service` applies Spotless formatting
3. [ ] `pnpm nx run-many -t lint` works across Java and TypeScript projects
4. [ ] Lint results are cached on subsequent runs
5. [ ] `pnpm nx affected -t lint` correctly identifies affected projects
6. [ ] CI pipeline runs lint target and catches violations

---

## Out of Scope

- Checkstyle integration (use Spotless for formatting rules)
- PMD/SpotBugs static analysis (potential future enhancement)
- Custom ArchUnit rules beyond current `ArchitectureRules`

---

## References

- [Nx Gradle Plugin Docs](https://nx.dev/nx-api/gradle)
- [ArchUnit JUnit 5 Integration](https://www.archunit.org/userguide/html/000_Index.html#_junit_5)
- [Spotless Gradle Plugin](https://github.com/diffplug/spotless/tree/main/plugin-gradle)
- [JUnit 5 Tags and Filtering](https://junit.org/junit5/docs/current/user-guide/#running-tests-tags)
