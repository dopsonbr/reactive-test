# Documentation Standard

## Intent

Provide consistent documentation for humans and AI agents to navigate and understand the codebase efficiently.

## Outcomes

- Every module has README, AGENTS, CONTENTS files
- AI agents can navigate efficiently
- Humans understand purpose and usage
- Consistent documentation structure

## Patterns

### Documentation Files Per Module

Every module (app or library) has these files:

```
module/
├── README.md    # Purpose, usage, configuration
├── AGENTS.md    # AI agent guidance
├── CONTENTS.md  # File/package index
└── src/
```

### README.md Template

```markdown
# Module Name

Brief description (1-2 sentences).

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

### As a Dependency

```kotlin
dependencies {
    implementation(project(":libs:platform:platform-module"))
}
```

### Basic Usage

```java
// Code example showing typical usage
```

## Configuration

```yaml
module:
  setting1: value1
  setting2: value2
```

## Key Classes

| Class | Purpose |
|-------|---------|
| `MainClass` | Primary entry point |
| `ConfigClass` | Configuration handling |

## Running

```bash
# How to run/test this module
./gradlew :module:test
```

## Related

- [Related Standard](../standards/related.md)
- [Other Module](../other-module/README.md)
```

### AGENTS.md Template

```markdown
# Module Agent Guidelines

## Overview

Brief description of what this module does and its role in the system.

## Key Files

| File | Purpose |
|------|---------|
| `MainClass.java` | Primary functionality |
| `Config.java` | Configuration handling |
| `application.yml` | Runtime configuration |

## Common Tasks

### Adding a New Feature

1. Step one
2. Step two
3. Step three

### Fixing Common Issues

- Issue type 1: Solution approach
- Issue type 2: Solution approach

## Patterns Used

### Pattern Name

Brief description of the pattern and how it's implemented.

```java
// Pseudo-code example
```

## Anti-patterns

- What NOT to do
- Why it's problematic

## Dependencies

- `module-a` - Why this dependency exists
- `module-b` - Why this dependency exists

## Testing

```bash
# Run tests
./gradlew :module:test

# Run specific test
./gradlew :module:test --tests "TestClass.testMethod"
```
```

### CONTENTS.md Template

```markdown
# Module Contents

## Main Source (`src/main/java/org/example/...`)

### Package: `controller/`
- `ProductController.java` - REST endpoints for products

### Package: `service/`
- `ProductService.java` - Business logic for product aggregation

### Package: `repository/`
- `MerchandiseRepository.java` - Merchandise API client
- `PriceRepository.java` - Price API client

### Package: `domain/`
- `Product.java` - Product domain model

### Package: `config/`
- `ProductServiceConfig.java` - Spring configuration

### Package: `validation/`
- `ProductRequestValidator.java` - Request validation

## Resources (`src/main/resources/`)
- `application.yml` - Application configuration

## Tests (`src/test/java/org/example/...`)
- `ProductServiceTest.java` - Unit tests
- `ProductControllerIntegrationTest.java` - Integration tests
```

### Directory-Level Documentation

For directories containing multiple modules:

```markdown
# Apps Directory

Applications built on the platform libraries.

## Applications

| Application | Port | Description |
|-------------|------|-------------|
| `product-service` | 8080 | Product aggregation service |
| `cart-service` | 8082 | Shopping cart management |

## Adding a New Application

1. Create directory: `apps/new-service/`
2. Create `build.gradle.kts` with `platform.application-conventions`
3. Add to `settings.gradle.kts`
4. Create documentation files (README, AGENTS, CONTENTS)

## Standards

All applications follow these standards:
- [Architecture](../docs/standards/architecture.md)
- [Error Handling](../docs/standards/error-handling.md)
- [Testing](../docs/standards/testing-integration.md)
```

### Writing for AI Agents

AGENTS.md files should:
1. **Be specific**: Include exact file paths and class names
2. **Provide context**: Explain WHY, not just WHAT
3. **Include examples**: Show patterns with pseudo-code
4. **List anti-patterns**: Help agents avoid common mistakes
5. **Reference standards**: Link to relevant standard documents

### Writing for Humans

README.md files should:
1. **Start with purpose**: What problem does this solve?
2. **Show usage**: Working code examples
3. **Document configuration**: All configurable options
4. **Explain running**: How to start, test, debug
5. **Link related resources**: Other docs, external references

### Keeping Documentation Current

Update documentation when:
- Adding new features
- Changing configuration options
- Modifying public APIs
- Fixing confusing behaviors
- Updating dependencies

## Anti-patterns

### No Documentation

```
module/
└── src/  # No README, AGENTS, or CONTENTS
```

Every module MUST have documentation files.

### Outdated Documentation

```markdown
## Configuration

```yaml
old-property: value  # Property renamed 3 months ago
```
```

Keep documentation in sync with code changes.

### Implementation Code in Standards

```markdown
# Caching Standard

## Implementation

```java
@Service
public class CacheService {
    @Autowired
    private RedisTemplate<String, String> redis;
    // Full implementation code
}
```
```

Standards describe patterns and intent, not implementation code. Implementation lives in the modules themselves.

### Missing File Index

```markdown
# CONTENTS.md

This module contains Java code.
```

CONTENTS.md should list every significant file with its purpose.

### Generic Descriptions

```markdown
# Module Name

This module does things.

## Features

- Stuff
- More stuff
```

Be specific about what the module does and why.

### No Usage Examples

```markdown
## Usage

Use the ProductService class.
```

Always include working code examples:

```markdown
## Usage

```java
@Autowired
private ProductService productService;

public void example() {
    productService.getProduct(123456L)
        .subscribe(product -> {
            System.out.println(product.description());
        });
}
```
```

### Documenting Internal Details

```markdown
## Internal Architecture

The service uses a HashMap on line 47 that gets...
```

Focus on public APIs and usage, not internal implementation that may change.

## Reference

- `apps/product-service/` - Reference implementation with full docs
- `docs/standards/` - All platform standards
- `docs/templates/` - Documentation templates
