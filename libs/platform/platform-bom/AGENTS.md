# Platform BOM Agent Guidelines

## Boundaries

Files requiring careful review: `build.gradle.kts` (affects all modules)

## Conventions

- All dependency versions declared in `gradle/libs.versions.toml`
- Constraints reference versions from catalog via `libs.*` notation
- Spring Boot BOM imported as foundation, extended with platform-specific dependencies
- No source code in this module (build file only)

## Common Tasks

### Add New Dependency to BOM

1. Add version to `/Users/BXD5017/github/dopsonbr/reactive-test/gradle/libs.versions.toml`:
   ```toml
   [versions]
   new-dep = "1.0.0"

   [libraries]
   new-dep = { module = "group:artifact", version.ref = "new-dep" }
   ```

2. Add constraint to `build.gradle.kts`:
   ```kotlin
   constraints {
       api(libs.new.dep)
   }
   ```

3. Dependent modules now omit version when declaring dependency

### Update Dependency Version

1. Modify version in `gradle/libs.versions.toml`
2. Run `./gradlew buildAll` to verify compatibility across all modules
3. Check for breaking changes in dependency release notes

### Import Additional BOM

```kotlin
dependencies {
    api(platform("group:artifact-bom:version"))
}
```

## Warnings

- Changing versions affects all applications and libraries that depend on this BOM
- Test all modules after version updates
- Avoid version conflicts by keeping Spring Boot BOM as the foundation
