---
description: Merge a completed feature branch/worktree to main and archive its implementation plan(s)
---

# Merge and Archive Feature

You are helping merge a completed feature and archive its implementation plan(s).

**Feature Name:**
$ARGUMENTS

---

## PROCESS OVERVIEW

1. **Locate Worktree** - Find the worktree for this feature
2. **Validate State** - Ensure main and feature branch are clean and ready
3. **Merge** - Merge the feature branch to main, resolving conflicts intelligently
4. **Archive Plans** - Move related implementation plans to docs/archive/
5. **Assess Verification** - Determine if post-merge verification is needed

---

## PHASE 1: LOCATE WORKTREE

First, list all worktrees and find the one matching this feature:

```bash
git worktree list
```

**Matching Logic:**
- Look for worktrees with branch names containing the feature name/number
- Common patterns: `feature/{number}-{name}`, `feature/{name}`, `{number}_{name}`
- If no exact match, list candidates and ask user to confirm

**If no worktree found:**
- Check if there's a remote branch: `git branch -r | grep -i "{feature}"`
- If a branch exists without a worktree, inform the user and ask how to proceed
- If no branch exists, STOP and report the feature was not found

**Store for later use:**
- Worktree path
- Branch name
- Feature number (if present in branch name, e.g., "025" from "feature/025-fulfillment-stubs")

---

## PHASE 2: VALIDATE STATE

### 2.1 Check Main Branch State

From the main worktree (current directory):

```bash
# Ensure we're on main
git branch --show-current

# Check for uncommitted changes
git status --porcelain

# Fetch latest from remote
git fetch origin main

# Check if main is up to date
git log HEAD..origin/main --oneline
```

**Main must be:**
- On the `main` branch
- Clean (no uncommitted changes)
- Up to date with origin/main (or user confirms proceeding with local-only changes)

### 2.2 Check Feature Branch State

From the feature worktree:

```bash
cd {worktree_path}

# Check for uncommitted changes
git status --porcelain

# Check commit count ahead of main
git log main..HEAD --oneline
```

**Feature branch must be:**
- Clean (no uncommitted changes)
- Have at least one commit ahead of main

### 2.3 Report State Summary

Report to user:
- Main status: clean/dirty, commits behind origin
- Feature status: clean/dirty, commits ahead of main
- List the commits that will be merged

**If either branch has issues, STOP and report what needs to be fixed.**

---

## PHASE 3: MERGE

### 3.1 Perform Merge

From the main worktree:

```bash
git merge {feature_branch} --no-ff -m "Merge {feature_branch}: {summary of feature}"
```

### 3.2 Handle Merge Conflicts

If conflicts occur, use intelligent resolution:

**For each conflicted file:**

1. **Read both versions** - Understand what each branch was trying to do
2. **Identify conflict type:**
   - **Additive (both added)**: Usually keep both additions, ordering logically
   - **Modification (both changed same lines)**: Analyze intent, often combine logic
   - **Delete vs modify**: Usually keep the modification unless deletion was intentional cleanup
   - **Configuration files** (package.json, build.gradle.kts, settings.gradle.kts): Merge all additions, use higher versions

3. **Common patterns:**
   - `settings.gradle.kts` include conflicts: Keep all module includes
   - `CLAUDE.md` service table conflicts: Add all new services in port order
   - `docker-compose.yml` service conflicts: Add all new services
   - Test files: Keep all new tests
   - Import statements: Keep all imports, remove duplicates

4. **After resolving each file:**
   ```bash
   git add {file}
   ```

5. **Complete merge:**
   ```bash
   git commit --no-edit
   ```

### 3.3 Verify Merge

```bash
# Show merge commit
git log -1 --stat

# Verify branch is ahead of origin/main
git status
```

---

## PHASE 4: ARCHIVE IMPLEMENTATION PLANS

### 4.1 Find Related Plans

Look for implementation plans in the repository root that match the feature:

```bash
ls -la *.md | grep -E "^-"
```

**Matching Logic:**
- Match by number: If feature is "025-fulfillment-stubs", look for `025*.md`
- Match by name: Look for plans with similar keywords
- Check for parent/child plans: `025_*.md`, `025A_*.md`, `025B_*.md`, etc.

### 4.2 Archive Each Plan

For each matching plan:

```bash
git mv {plan}.md docs/archive/{plan}.md
```

### 4.3 Commit Archive

```bash
git add docs/archive/
git commit -m "Archive completed {feature_number} {feature_name}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## PHASE 5: POST-MERGE VERIFICATION ASSESSMENT

Analyze the merged changes to determine if verification is needed.

### 5.1 Analyze Change Scope

```bash
# Get list of changed files
git diff main~{merge_commits}..main --name-only

# Categorize changes
git diff main~{merge_commits}..main --stat
```

### 5.2 Risk Assessment Criteria

**HIGH RISK (Confidence 0-30 that no verification needed):**
- Changes to core platform libraries (libs/platform/*)
- Database schema changes
- Authentication/authorization changes
- Changes affecting multiple services
- Build system changes (build.gradle.kts, settings.gradle.kts at root)
- CI/CD pipeline changes
- Docker compose changes affecting existing services

**MEDIUM RISK (Confidence 31-60 that no verification needed):**
- New service added (isolated, but integration points exist)
- Changes to existing service APIs
- New dependencies added
- Test infrastructure changes
- Configuration file changes

**LOW RISK (Confidence 61-85 that no verification needed):**
- Documentation-only changes
- New isolated tests
- Code style/formatting changes
- Adding new optional features that don't affect existing code paths

**MINIMAL RISK (Confidence 86-100 that no verification needed):**
- README updates only
- Comment changes only
- Adding new files that nothing depends on yet

### 5.3 Generate Verification Report

Provide to user:

```
## Post-Merge Verification Assessment

**Feature:** {feature_name}
**Commits Merged:** {count}
**Files Changed:** {count}

### Risk Analysis

**Categories touched:**
- [ ] Platform libraries: {yes/no} - {details}
- [ ] Database/schema: {yes/no} - {details}
- [ ] Auth/security: {yes/no} - {details}
- [ ] Build system: {yes/no} - {details}
- [ ] Multiple services: {yes/no} - {details}
- [ ] New service: {yes/no} - {details}
- [ ] Existing APIs: {yes/no} - {details}

### Confidence Score: {0-100}

**{score}/100** - {interpretation}

### Recommended Actions

{If score < 50:}
**Manual verification recommended:**
1. {specific verification step based on what changed}
2. {another step}

{If score >= 50 and < 80:}
**Light verification suggested:**
1. {quick check}

{If score >= 80:}
**No manual verification required** - Changes are low-risk and isolated.
```

---

## PHASE 6: CLEANUP WORKTREE (Optional)

Ask the user if they want to remove the worktree:

```bash
# Remove worktree
git worktree remove {worktree_path}

# Delete branch locally
git branch -d {feature_branch}

# Delete remote branch (if exists)
git push origin --delete {feature_branch}
```

**Only proceed with cleanup if user confirms.**

---

## OUTPUT SUMMARY

At the end, provide:

1. **Merge Status:** Success/failure with commit SHA
2. **Archived Plans:** List of plans moved to docs/archive/
3. **Verification Score:** 0-100 confidence that no additional verification needed
4. **Next Steps:** Any recommended actions

---

## ERROR HANDLING

- If any git command fails, report the error and current state
- If conflicts cannot be auto-resolved, show the conflict and ask for guidance
- If plans cannot be found, list what was searched and ask user to specify
- Never force-push or use destructive git operations without explicit user confirmation

---

## IMPORTANT NOTES

- This command should be run from the main worktree (not the feature worktree)
- Always use --no-ff to preserve merge history
- Never delete branches or worktrees without user confirmation
- If the feature number isn't clear from the name, ask the user to specify which plans to archive
