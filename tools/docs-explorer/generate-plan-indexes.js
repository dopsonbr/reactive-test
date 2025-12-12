#!/usr/bin/env node

/**
 * Generates index.md files for docs/plans/active, docs/plans/completed, and docs/ADRs
 * by scanning the directories and extracting titles from files.
 *
 * Run as part of docs:build to keep indexes in sync with actual files.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.join(__dirname, '..', '..', 'docs');
const ACTIVE_DIR = path.join(DOCS_ROOT, 'plans', 'active');
const COMPLETED_DIR = path.join(DOCS_ROOT, 'plans', 'completed');
const ADRS_DIR = path.join(DOCS_ROOT, 'ADRs');

/**
 * Extract title from a markdown file (first H1 heading)
 */
async function extractTitle(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Parse plan number and determine if it's a sub-plan
 */
function parsePlanInfo(filename) {
  const name = filename.replace(/\.md$/, '');
  // Match patterns like 055A, 055B (sub-plans) vs 055 (main plan)
  const match = name.match(/^(\d+)([A-Z])?[_-]?(.*)$/);
  if (!match) return null;

  return {
    number: match[1],
    letter: match[2] || null,
    slug: name,
    isSubPlan: !!match[2],
  };
}

/**
 * Scan a directory and get plan information
 */
async function scanPlans(dir) {
  const files = await readdir(dir);
  const plans = [];

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'index.md') continue;

    const info = parsePlanInfo(file);
    if (!info) continue;

    const title = await extractTitle(path.join(dir, file));
    plans.push({
      ...info,
      filename: file,
      title: title || info.slug,
    });
  }

  // Sort by number, then by letter
  return plans.sort((a, b) => {
    const numDiff = parseInt(a.number) - parseInt(b.number);
    if (numDiff !== 0) return numDiff;
    if (!a.letter && !b.letter) return 0;
    if (!a.letter) return -1;
    if (!b.letter) return 1;
    return a.letter.localeCompare(b.letter);
  });
}

/**
 * Group plans by main plan number
 */
function groupPlans(plans) {
  const groups = new Map();

  for (const plan of plans) {
    if (!groups.has(plan.number)) {
      groups.set(plan.number, { main: null, subPlans: [] });
    }
    const group = groups.get(plan.number);
    if (plan.isSubPlan) {
      group.subPlans.push(plan);
    } else {
      group.main = plan;
    }
  }

  return groups;
}

/**
 * Generate the active plans index
 */
async function generateActiveIndex(plans) {
  const groups = groupPlans(plans);
  const mainPlans = plans.filter((p) => !p.isSubPlan);
  const initiatives = [];
  const individual = [];

  // Separate initiatives (plans with sub-plans) from individual plans
  for (const plan of mainPlans) {
    const group = groups.get(plan.number);
    if (group.subPlans.length > 0) {
      initiatives.push({ plan, subPlans: group.subPlans });
    } else {
      individual.push(plan);
    }
  }

  let content = `# Active Implementation Plans

Current work in progress. Each plan documents the design, phases, and checklist for a feature or improvement.

`;

  if (initiatives.length > 0) {
    content += `## Major Initiatives

| Plan | Description | Sub-Plans |
|------|-------------|-----------|
`;
    for (const { plan, subPlans } of initiatives) {
      const subPlanLinks = subPlans
        .map((sp) => `[${sp.number}${sp.letter}](./${sp.slug})`)
        .join(', ');
      content += `| [${plan.title}](./${plan.slug}) | | ${subPlanLinks} |\n`;
    }
    content += '\n';
  }

  if (individual.length > 0) {
    content += `## Individual Plans

| Plan | Description |
|------|-------------|
`;
    for (const plan of individual) {
      content += `| [${plan.title}](./${plan.slug}) | |\n`;
    }
    content += '\n';
  }

  // Add sub-plans that don't have a main plan (orphaned sub-plans)
  const orphanedSubPlans = plans.filter((p) => {
    if (!p.isSubPlan) return false;
    const group = groups.get(p.number);
    return !group.main;
  });

  if (orphanedSubPlans.length > 0) {
    content += `## Sub-Plans (No Main Plan)

| Plan | Description |
|------|-------------|
`;
    for (const plan of orphanedSubPlans) {
      content += `| [${plan.title}](./${plan.slug}) | |\n`;
    }
    content += '\n';
  }

  content += `---

::: tip Browse the archive
See [Completed Plans](/plans/completed/) for historical implementation plans.
:::
`;

  return content;
}

/**
 * Generate the completed plans index
 */
async function generateCompletedIndex(plans) {
  const mainPlans = plans.filter((p) => !p.isSubPlan);

  let content = `# Completed Implementation Plans

Historical archive of ${mainPlans.length}+ implementation plans preserved for reference. Plans document design decisions, phases, and lessons learned.

## All Completed Plans

| # | Plan |
|---|------|
`;

  for (const plan of mainPlans) {
    content += `| ${plan.number} | [${plan.title}](./${plan.slug}) |\n`;
  }

  content += `
---

::: tip Current Work
See [Active Plans](/plans/active/) for work in progress.
:::

::: info Plan Numbering
Plans use sequential numbering (000-0XX). Sub-plans use letter suffixes (021A, 021B). Gaps in numbering indicate abandoned or merged plans.
:::
`;

  return content;
}

/**
 * Scan ADRs directory and get ADR information
 */
async function scanADRs(dir) {
  const files = await readdir(dir);
  const adrs = [];

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'index.md') continue;

    const name = file.replace(/\.md$/, '');
    // Match patterns like 000-name or 001_name
    const match = name.match(/^(\d+)[-_](.+)$/);
    if (!match) continue;

    const title = await extractTitle(path.join(dir, file));
    adrs.push({
      number: match[1],
      slug: name,
      filename: file,
      title: title || name,
    });
  }

  // Sort by number
  return adrs.sort(
    (a, b) => parseInt(a.number) - parseInt(b.number)
  );
}

/**
 * Generate the ADRs index
 */
async function generateADRsIndex(adrs) {
  let content = `# Architectural Decision Records

Authoritative log of platform-level decisions. Each ADR captures the context, the decision, and its consequences. Review these before proposing conflicting changes.

## Index

`;

  for (const adr of adrs) {
    content += `- [${adr.number} - ${adr.title.replace(/^ADR[- ]?\d+[: -]*/i, '').replace(/^\d+[: -]*/i, '')}](./${adr.slug}.md)\n`;
  }

  content += `
---

::: info Adding New ADRs
Use the \`/create-adr\` command to create a new ADR following the MADR 4.0.0 format.
:::
`;

  return content;
}

async function main() {
  console.log('Generating indexes...');

  // Generate active plans index
  const activePlans = await scanPlans(ACTIVE_DIR);
  const activeIndex = await generateActiveIndex(activePlans);
  await writeFile(path.join(ACTIVE_DIR, 'index.md'), activeIndex);
  console.log(`  Generated plans/active/index.md (${activePlans.length} plans)`);

  // Generate completed plans index
  const completedPlans = await scanPlans(COMPLETED_DIR);
  const completedIndex = await generateCompletedIndex(completedPlans);
  await writeFile(path.join(COMPLETED_DIR, 'index.md'), completedIndex);
  console.log(
    `  Generated plans/completed/index.md (${completedPlans.length} plans)`
  );

  // Generate ADRs index
  const adrs = await scanADRs(ADRS_DIR);
  const adrsIndex = await generateADRsIndex(adrs);
  await writeFile(path.join(ADRS_DIR, 'index.md'), adrsIndex);
  console.log(`  Generated ADRs/index.md (${adrs.length} ADRs)`);

  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
