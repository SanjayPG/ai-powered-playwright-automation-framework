# Playwright Automation Review

Check the target files against the `automation-standards` skill.

## Step 1 — Identify target files

If file paths are provided through $ARGUMENTS,
review those files.

If no paths are provided, identify files changed
compared with the main branch.

## Step 2 — Review test structure

Check whether:

- Tests represent a single business scenario.
- Tests are independent.
- Setup and teardown are handled correctly.
- Tests don't depend on execution order.
- Test data is appropriately managed.

## Step 3 — Review locator strategy

Check whether:

- Locators follow the project's preferred strategy.
- Raw CSS/XPath selectors are avoided where appropriate.
- Locators are maintained inside Page Objects where required.
- Selectors are not unnecessarily duplicated.

## Step 4 — Review Page Object usage

Check whether:

- Page-specific locators are inside Page Objects.
- Page-specific actions are encapsulated.
- Tests focus on business behaviour.

## Step 5 — Review Playwright practices

Check for:

- Unnecessary waits such as page.waitForTimeout().
- Incorrect assertion usage.
- Unnecessary retries.
- Improper fixture usage.
- Duplicate code.
- Unnecessary mutable state.

## Step 6 — Compare against the automation-standards skill

For every violation provide:

- File and line number.
- Relevant project standard.
- Why it matters.
- Concrete fix.

## Step 7 — Final verdict

Return one of:

BLOCK
FIX-BEFORE-MERGE
NITS-ONLY
PASS

Do not modify any files.
