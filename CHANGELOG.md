# pi-quests Changelog

## [Unreleased]

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

