# pi-quests Changelog

## [Unreleased]

## [0.1.0] - 2026-04-10

- feat: add session-scoped quest log with tools, commands, and TUI widgets
  - add `QuestLog` with history stack, revert, and session reconstruction
  - expose `quest` tool with add, list, toggle, update, delete, clear, and revert
  - add `/quests` command namespace with interactive list widget and pagination
  - split renderers into dedicated tools, commands, and changelog modules
  - include `AGENTS.md` and concise docs for architecture, patterns, and reference
- chore: setup initial pi extension boilerplate

