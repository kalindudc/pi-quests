# Architecture

## Overview

pi-quests is a [pi](https://github.com/mariozechner/pi-coding-agent) extension that adds a session-scoped quest log. It exposes one LLM-callable tool (`quest`) and one command namespace (`/quests`) that operate on a shared in-memory `QuestLog`.

The extension loads via `pi -e ./src/index.ts`. On load it registers the tool, command, message renderer, and session event hooks.

## Module map

| Module | Purpose |
|--------|---------|
| `src/index.ts` | Entry point — creates `QuestLog`, registers tools/commands/renderers, wires session hooks |
| `src/quests.ts` | `QuestLog` — quest array, auto-increment ID, history stack, revert, session reconstruction |
| `src/tools/quest.ts` | `quest` tool implementation (`add`, `list`, `toggle`, `update`, `delete`, `clear`, `revert`) |
| `src/commands/quests.ts` | `/quests` command dispatcher and argument parser |
| `src/renderers/tools.ts` | TUI renderers for tool calls and results |
| `src/renderers/commands.ts` | `QuestListWidget` — interactive paginated quest list |
| `src/renderers/changelog.ts` | Message renderer for `quest-changelog` messages |
| `src/logger.ts` | Namespaced debug logging |
| `src/version.ts` | Version and changelog path constants |

## Data flow

### Tool execution

1. LLM emits `quest` tool call with `action` and params
2. `questToolExecute` validates params and mutates `QuestLog`
3. `QuestLog` pushes a `HistoryEntry` for revertable actions (`add`, `toggle`, `update`, `delete`, `clear`)
4. Result returns plain text plus `details: { quests, nextId }` for session reconstruction
5. TUI renders the call header and a themed quest checklist

### Command execution

1. User types `/quests <subcommand>`
2. `parseQuestArgs` tokenizes and validates input
3. Handler mutates `QuestLog` and notifies via `ctx.ui.notify`
4. `list` opens `QuestListWidget` for interactive browsing

### Session reconstruction

On `session_start` and `session_tree`, the extension walks the current branch for the most recent `quest` tool result and restores `quests` and `nextId`. This makes the log survive branch switches without explicit persistence.

## State management

`QuestLog` holds three pieces of mutable state:
- `quests: Quest[]` — active quest items
- `nextId: number` — next auto-assigned quest ID
- `history: HistoryEntry[]` — reversible action stack

All mutations return the affected quest (or count) so callers can produce user-facing messages. The history stack enables a single-level undo via `revert()`.
