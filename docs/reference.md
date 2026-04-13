# Reference

> See also: [Quests](quests.md) · [Pattern](pattern.md) · [Architecture](architecture.md)

## Quick reference

| Name | Type | Purpose |
|------|------|---------|
| `quest` | Tool | Add, list, toggle, update, delete, clear, reorder, or revert quests |
| `/quests` | Command | User-facing quest commands |

## Tool: `quest`

**Schema:**

```typescript
{
  action: "add" | "list" | "toggle" | "update" | "delete" | "clear" | "reorder" | "revert",
  descriptions?: string[],
  description?: string,
  id?: string,
  parentId?: string,
  targetId?: string,
  all?: boolean
}
```

| Action | Required params | Behavior |
|--------|----------------|----------|
| `add` | `descriptions[]` | Adds one or many quests (required). Use `parentId` to add sub-quests. |
| `list` | — | Returns all quests as plain text |
| `toggle` | `id` | Flips `done` flag for the given quest |
| `update` | `id`, `description` | Changes a quest description |
| `delete` | `id` | Removes a quest |
| `clear` | — | Removes completed quests. Set `all: true` to remove everything. |
| `reorder` | `id`, `targetId` | Moves a quest before the target quest |
| `revert` | — | Reverts the most recent mutating action |

**Result shape:**

```typescript
{
  content: [{ type: "text", text: string }],
  details: { quests: Quest[], usedIds: string[] }
}
```

## Command: `/quests`

| Subcommand | Usage | Behavior |
|------------|-------|----------|
| `add` | `/quests add [--parent <id>] <description>` | Add a quest or sub-quest |
| `list` | `/quests list` | Open interactive quest list widget |
| `toggle` | `/quests toggle <id>` | Toggle quest completion |
| `update` | `/quests update <id> <description>` | Update description |
| `delete` | `/quests delete <id>` | Delete a quest |
| `clear` | `/quests clear [all]` | Clear completed quests, or optionally all quests |
| `reorder` | `/quests reorder <id> <targetId>` | Reorder a quest before the target quest |
| `revert` | `/quests revert` | Revert last change |
| `version` | `/quests version` | Show extension version |
| `changelog` | `/quests changelog` | Show reversed changelog |
| `help` | `/quests help` | Show subcommand list |

Omitting the subcommand defaults to `list`.

## Widget shortcuts

When viewing the quest list:

- `q` / `Esc` — close widget
- `Tab` — next page
- `Shift+Tab` — previous page
