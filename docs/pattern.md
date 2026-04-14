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

## Split a quest into steps

**Via command:**

```bash
/quests add-step 0a Write unit tests
```

**Via tool:**

```json
{ "action": "split", "id": "0a", "descriptions": ["Write unit tests"] }
```

The `add_step` tool action is an alias for `split`.
**Via tool (alias):**

```json
{ "action": "add_step", "id": "0a", "descriptions": ["Write unit tests"] }
```

## Toggle completion

**Via command:**

```bash
/quests toggle 3f
```

**Via tool:**

```json
{ "action": "toggle", "id": "3f" }
```

## Reorder quests

**Via command:**

```bash
/quests reorder 0a 3f
```

**Via tool:**

```json
{ "action": "reorder", "id": "0a", "targetId": "3f" }
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
- indented step rows
- page navigation (`Tab` / `Shift+Tab`)

## Recover quests after a branch switch

Quest state is automatically reconstructed from the session tree when the branch changes. No manual action is required.

If you need to force a snapshot for later reconstruction, issue a `list` tool call — the result stores the full quest array in the branch.
