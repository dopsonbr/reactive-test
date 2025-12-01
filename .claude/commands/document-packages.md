---
description: Document all Java packages with standardized README, CONTENTS, and AGENTS files
---

For each package directory under $ARGUMENTS (or src/main/java if not specified):

1. Use the package-documenter subagent to analyze and document the package
2. Create README.md, CONTENTS.md, and AGENTS.md in each package root
3. After completing all packages, create a root-level PACKAGES.md that indexes all documented packages

Skip packages that already have all three files unless I explicitly ask to regenerate.

Report progress as: "Documented X/Y packages: [current package name]"