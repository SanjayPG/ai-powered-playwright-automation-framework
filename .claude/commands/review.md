# Playwright Automation Review

## Step 1 — Identify target files

If file paths are provided through $ARGUMENTS, review those files.
If no paths are provided, identify files changed compared with the main branch.

## Step 2 — Fan out

Spawn, all in parallel:
- one `spec-reviewer` subagent per changed spec / page object, one path each;
- one `security-agent` subagent over the whole list of changed files.

## Step 3 — Merge results

Collect every JSON array. Merge into one list. If the same line is flagged by
both agents, keep it once at the higher severity.

## Step 4 — Report

Print: findings grouped by file, a short "Security" section, then a one-line
verdict (BLOCK / FIX-BEFORE-MERGE / NITS-ONLY / PASS).

## Step 5 — Failure handling

A subagent that fails: log `[SKIP] <name/path>` and keep the rest.

Do not modify any files.