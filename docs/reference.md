# Reference

> See also: [Quests](quests.md) · [Pattern](pattern.md) · [Architecture](architecture.md)

## Quick reference

| Name | Type | Purpose |
|------|------|---------|
| `quest` | Tool | Add, list, toggle, update, delete, clear, or revert quests |
| `/quests` | Command | User-facing quest commands |

## Tool: `quest`

**Schema:**

```typescript
{
  action: "add" | "list" | "toggle" | "update" | "delete" | "clear" | "revert",
  description?: string,
  descriptions?: string[],
  id?: number
}
```

| Action | Required params | Behavior |
|--------|----------------|----------|
| `add` | `description` or `descriptions[]` | Adds one or many quests |
| `list` | — | Returns all quests as plain text |
| `toggle` | `id` | Flips `done` flag for the given quest |
| `update` | `id`, `description` | Changes a quest description |
| `delete` | `id` | Removes a quest |
| `clear` | — | Removes all quests and resets ID counter |
| `revert` | — | Reverts the most recent mutating action |

**Result shape:**

```typescript
{
  content: [{ type: "text", text: string }],
  details: { quests: Quest[], nextId: number }
}
```

## Command: `/quests`

| Subcommand | Usage | Behavior |
|------------|-------|----------|
| `add` | `/quests add <description>` | Add a quest |
| `list` | `/quests list` | Open interactive quest list widget |
| `toggle` | `/quests toggle <id>` | Toggle quest completion |
| `update` | `/quests update <id> <description>` | Update description |
| `delete` | `/quests delete <id>` | Delete a quest |
| `clear` | `/quests clear` | Clear all quests |
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
