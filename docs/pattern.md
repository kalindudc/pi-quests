# Pattern

> See also: [Quests](quests.md) · [Reference](reference.md) · [Architecture](architecture.md)

## Add a quest

**Via command:**

```bash
/quests add Refactor auth middleware
```

**Via tool:**

```json
{ "action": "add", "descriptions": ["Refactor auth middleware"] }
```

**Batch via tool:**

```json
{ "action": "add", "descriptions": ["Task A", "Task B", "Task C"] }
```

## Toggle completion

**Via command:**

```bash
/quests toggle 3
```

**Via tool:**

```json
{ "action": "toggle", "id": 3 }
```

## Revert a mistake

If a quest was accidentally toggled, updated, or deleted:

```bash
/quests revert
```

Or via tool:

```json
{ "action": "revert" }
```

Only the most recent mutating action is reverted.

## View the quest list interactively

```bash
/quests list
```

Opens a paginated widget showing:
- progress bar
- checked/unchecked quest rows
- page navigation (`Tab` / `Shift+Tab`)

## Recover quests after a branch switch

Quest state is automatically reconstructed from the session tree when the branch changes. No manual action is required.

If you need to force a snapshot for later reconstruction, issue a `list` tool call — the result stores the full quest array in the branch.
