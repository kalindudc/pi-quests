# Quests

> See also: [Reference](reference.md) · [Pattern](pattern.md) · [Architecture](architecture.md)

## What is a quest?

A **quest** is a lightweight task item with an ID, description, completion flag, and creation timestamp. The LLM and user can add, toggle, update, and delete quests throughout a session.

## Quest state

A quest is defined as:

```typescript
interface Quest {
  id: number;
  description: string;
  additionalContext?: string;
  done: boolean;
  createdAt: number;
}
```

IDs auto-increment per session and are restored during session reconstruction.

## History and revert

Every mutating action (`add`, `toggle`, `update`, `delete`, `clear`) pushes a typed `HistoryEntry` onto a stack. Calling `revert` pops the most recent entry and restores the previous state:

- `add` → removes the added quest
- `toggle` → flips the done flag back
- `update` → restores the previous description
- `delete` → reinserts the quest at its original index
- `clear` → restores the full quest array and next ID

Only the most recent action can be reverted. There is no multi-level undo.

## Session reconstruction

Because tool results are stored in the session branch, `QuestLog` can reconstruct its entire state by scanning for the latest `quest` tool result. This happens automatically on `session_start` and `session_tree` events.

Reconstruction requires no disk persistence and survives branch switches.
