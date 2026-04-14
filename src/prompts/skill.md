---
name: quest-management
description: Quest management best practices for the pi-quests extension. Use when the user asks about tracking tasks, managing quests, using the quest tool, or when you need guidance on how to structure session work into quests and steps.
---

# Quest Management

## When to use quests

Use the quest tool at the start of any non-trivial task. If the request involves multiple steps, files, tool calls, or minion delegation, track it with quests.

## Capabilities

| Action | Purpose |
|--------|---------|
| `add` | Create top-level quests |
| `split` / `add_step` | Break a quest into steps under a parent |
| `reparent` | Promote, demote, or move a quest/step via optional `parentId` |
| `toggle` | Mark a quest or step done/undone |
| `update` | Change a quest description |
| `delete` | Remove a quest or step |
| `clear` | Remove completed quests (or all with `all: true`) |
| `reorder` | Change the priority order of top-level quests |
| `revert` | Undo the most recent mutating action |
| `list` | View all quests and steps |

## Common patterns

### Multi-step task workflow
1. Add many top-level quests for the overall goal
2. Split them into steps for each distinct deliverable
3. Execute steps sequentially, toggling each done as you finish
4. Toggle the parent quest done only after all steps are complete

### Delegation workflow
1. Add a quest for the delegated task
2. Spawn the minion and assign the work
3. Toggle the quest done when the minion returns successfully

### Reparenting
- Promote a step: `reparent <step-id>` (omit `parentId`)
- Demote a quest: `reparent <quest-id> <parent-id>`
- Move a step: `reparent <step-id> <new-parent-id>`

## Rules

- Steps cannot have nested steps. Only top-level quests can be parents.
- A parent with incomplete steps cannot be toggled done or deleted.
- Deleting a done parent cascade-deletes its done steps.
- Revert only undoes the most recent mutating action.
- Quest IDs are random hex strings shown in square brackets (e.g., `[01]`, `[a3f1]`).
- Always use the hex ID for actions, never the positional number.

## Gotchas

- Use toggle for done states. NEVER use `update` to append "DONE", "- DONE", or any completion marker to a quest description.
- IDs are hex, not positional. The list shows `#1 [01] ...`. Use `01` in tool calls, not `1`.
- Steps cannot be reordered independently. Use `reorder` on top-level quests only.
- Clear completed quests before adding unrelated work. This keeps the log focused and reduces context noise.
- Parent blocked?: If you cannot toggle a parent done, check that all its steps are toggled done first.
