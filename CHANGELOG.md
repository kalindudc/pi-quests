# pi-quests Changelog

## [Unreleased]

## [0.3.0] - 2026-04-11

- feat: add reorder action to move quests by position (dataplane, tool, /quests command, renderer, revert support)
- feat: extend clear action with optional all flag to remove all quests regardless of done state
- feat: detect appended completion markers (e.g. "- DONE") and inject correction nudge via context hook
- feat: update list rendering to show 1-based positions instead of raw IDs
- fix: inline type imports across test files to comply with no-inline-imports rule
- chore: extract shared prompt strings into prompts.ts to eliminate duplication
- chore: fix release workflow output mapping in create-release job

## [0.2.0] - 2026-04-11

- feat: add dynamic quest usage nudges via context hook
- feat: inject quest management reminders into system prompt
- feat: render targeted quest results and add parameter descriptions
- chore: add npm release flow
- chore: refactor codebase for improved maintainability

## [0.1.0] - 2026-04-10

- feat: add session-scoped quest log with tools, commands, and TUI widgets
  - add `QuestLog` with history stack, revert, and session reconstruction
  - expose `quest` tool with add, list, toggle, update, delete, clear, and revert
  - add `/quests` command namespace with interactive list widget and pagination
  - split renderers into dedicated tools, commands, and changelog modules
  - include `AGENTS.md` and concise docs for architecture, patterns, and reference
- chore: setup initial pi extension boilerplate

