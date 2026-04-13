# Quests

> See also: [Reference](reference.md) · [Pattern](pattern.md) · [Architecture](architecture.md)

## What is a quest?

A **quest** is a lightweight task item with an ID, description, completion flag, and creation timestamp. The LLM and user can add, toggle, update, and delete quests throughout a session.

## Quest state

A quest is defined as:

```typescript
interface Quest {
  id: string;
  description: string;
  done: boolean;
  createdAt: number;
}
```

IDs are generated as random hex strings (2 characters by default) and are restored during session reconstruction.

## Sub-quests

A **sub-quest** is a quest that belongs to a parent top-level quest. Sub-quests are useful for breaking large tasks into smaller, trackable steps.

```typescript
interface SubQuest extends Quest {
  parentId: string;
}
```

- Sub-quests are displayed indented beneath their parent quest.
- A parent quest cannot be marked done until all its sub-quests are completed.
- A parent quest cannot be deleted until all its sub-quests are completed (deleting a done parent cascade-deletes its done sub-quests).
- Sub-quests cannot have nested sub-quests of their own.

## History and revert

Every mutating action (`add`, `toggle`, `update`, `delete`, `clear`, `reorder`) pushes a typed `HistoryEntry` onto a stack. Calling `revert` pops the most recent entry and restores the previous state:

- `add` → removes the added quest
- `toggle` → flips the done flag back
- `update` → restores the previous description
- `delete` → reinserts the quest at its original index (restores cascade-deleted sub-quests as well)
- `clear` → restores the full quest array and used IDs
- `reorder` → restores the original quest order and IDs

Only the most recent action can be reverted. There is no multi-level undo.

## Session reconstruction

Because tool results are stored in the session branch, `QuestLog` can reconstruct its entire state by scanning for the latest `quest` tool result. This happens automatically on `session_start` and `session_tree` events.

Reconstruction requires no disk persistence and survives branch switches.
