# Architecture

## Overview

pi-quests is a [pi](https://github.com/mariozechner/pi-coding-agent) extension that adds a session-scoped quest log. It exposes one LLM-callable tool (`quest`) and one command namespace (`/quests`) that operate on a shared in-memory `QuestLog`.

The extension loads via `pi install npm:pi-quests` (or `pi -e ./src/index.ts` for local development). On load it registers the tool, command, message renderer, session event hooks, and system prompt injection.

## Module map

| Module | Purpose |
|--------|---------|
| `src/index.ts` | Entry point — creates `QuestLog`, registers tools/commands/renderers, wires session hooks |
| `src/quests.ts` | `QuestLog` — quest array, auto-increment ID, history stack, revert, session reconstruction |
| `src/tools/quest.ts` | `quest` tool implementation (`add`, `list`, `toggle`, `update`, `delete`, `clear`, `revert`) |
| `src/commands/quests.ts` | `/quests` command dispatcher and argument parser |
| `src/renderers/tools.ts` | TUI renderers for tool calls and results |
| `src/renderers/commands.ts` | `QuestListWidget` — interactive paginated quest list |
| `src/renderers/tools.ts` | TUI renderers for `quest` tool call rows |
| `src/renderers/changelog.ts` | `quest-changelog` message renderer |
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

### Prompt injection

On `before_agent_start`, the extension prepends a high-salience `# Quest Management` gate to the system prompt (exploiting primacy bias), then appends a reminder block with active quests (exploiting recency). This creates an instruction sandwich that nudges the agent to track work as specific, actionable quests before any file reads or edits.

The `quest` tool registration also supplies `promptSnippet` and `promptGuidelines`, which the framework injects into the default system prompt when the tool is active.

### Session reconstruction

On `session_start` and `session_tree`, the extension walks the current branch for the most recent `quest` tool result and restores `quests` and `nextId`. This makes the log survive branch switches without explicit persistence.

## State management

`QuestLog` holds three pieces of mutable state:
- `quests: Quest[]` — active quest items
- `nextId: number` — next auto-assigned quest ID
- `history: HistoryEntry[]` — reversible action stack

All mutations return the affected quest (or count) so callers can produce user-facing messages. The history stack enables a single-level undo via `revert()`.
