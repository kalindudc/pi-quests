---
name: test-usability
description: Integration-test the pi-quests quest and subquest features by directly invoking the quest tool and /quests commands through isolated scenario playbooks.
---

# pi-quests Usability Test Skill

## Purpose

Run a hands-on integration test of the pi-quests extension by **using the actual `quest` tool and `/quests` command** in the conversation. Test scenarios live in isolated playbook files under `scenarios/` so each one can be detailed without overloading this skill.

## When to Use

- Before merging a feature branch as a final gate
- When investigating a quest/subquest regression

## Pre-Test Setup

1. Run the following checks, if any fail, STOP, and report the failure to the user. DO NOT PROCEED if pre-test checks fail
  - `npm run typecheck` exits with code 0
  - `npx vitest run --reporter=json` exits with code 0 and no failed tests
  - `npm run style:fix` exits with code 0
2. Acknowledge that the live session quest log will be modified during testing.
3. Discover scenarios to test in `.pi/skills/test-usability/scenarios/`, if no scenarios are present, STOP and report to the user.
4. Each test must be run one at a time using the `Test protocol` below. DO NOT run multiple scenarios in parallel

## Test protocol

1. Load the scenario markdown file and read it completely before executing any steps
2. Run each step sequentially, and record each output and outcome
3. If a step fails, claissify it in the following severity levels:
   - CRITICAL: Misleading "not found" error, silent failure, data loss on revert, orphaned subquest, etc..
   - MAJOR: Feature gap with a clear but wrong error message
   - MINOR: UI formatting issue or missing convenience
4. After all steps, run the cleanup instructions to remove test data from the quest log
5. SKIP compiling a report if all steps pass with expected results, otherwise, compile a report with failed steps and recommendations for improvement
6. Compile results into the report template below, and write to `./tmp/usability-report-<branch>-<timestamp>.md`

## Report Template

Write findings to `./tmp/usability-report-<branch>-<timestamp>.md` with this structure:

```markdown
# Usability Test Report — <branch> — <timestamp>

## Summary
- Scenarios tested: <N>
- Passed: <N>
- Failed: <N>
- Critical issues: <list>

## Failed Scenarios
| Scenario | Step | Expect | Actual | Severity |
|----------|------|--------|--------|----------|
| ... | ... | ... | ... | CRITICAL/MAJOR/MINOR |

## Recommendations
1. ...
```

## Rules

- ALWAYS start with `npm run typecheck`.
- ALWAYS use the actual `quest` tool or `/quests` command for every step.
- ALWAYS read a scenario file fully before executing it, then follow its steps in order.
- NEVER skip a step because a previous step failed.
- ALWAYS record the verbatim tool result in the Actual column.
- ALWAYS run each scenario's cleanup so test data does not accumulate.
- NEVER run multiple scenarios at the same time, run them sequentially to avoid interleaving test data
