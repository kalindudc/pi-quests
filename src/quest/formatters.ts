/**
 * Error message design guidelines
 *
 * All error messages should follow a consistent three-part pattern:
 *   1. PROBLEM — state what went wrong clearly and concisely
 *   2. RULE    — explain the constraint or invariant that was violated
 *   3. RECOVERY HINT — suggest the next valid action the caller can take
 *
 * Example:
 *   "Quest [01] has incomplete sub-quests. A parent quest can only be marked
 *    done after all its sub-quests are complete. Try toggling the sub-quests first."
 *
 * Keep messages actionable. Agents should never be left guessing why something
 * failed or what to do next.
 */

export function formatQuestList(
  quests: { id: string; description: string; done: boolean; parentId?: string }[],
): string {
  if (quests.length === 0) return "No quests.";

  const lines: string[] = [];
  let pos = 1;
  for (const q of quests) {
    if (q.parentId) {
      lines.push(`   [${q.id}] [${q.done ? "x" : " "}] ${q.description}`);
    } else {
      lines.push(`#${pos} [${q.id}] [${q.done ? "x" : " "}] ${q.description}`);
      pos++;
    }
  }
  return lines.join("\n");
}

export function formatAddResult(q: { id: string; description: string }): string {
  return `Added quest [${q.id}]: ${q.description}`;
}

export function formatBatchAddResult(added: { id: string; description: string }[]): string {
  return `Added ${added.length} quests:\n${added.map((q) => `[${q.id}]: ${q.description}`).join("\n")}`;
}

export function formatToggleResult(id: string, done: boolean): string {
  return `Quest [${id}] ${done ? "done" : "undone"}`;
}

export function formatUpdateResult(q: { id: string; description: string }): string {
  return `Updated quest [${q.id}]: ${q.description}`;
}

export function formatDeleteResult(q: { id: string; description: string }): string {
  return `Deleted quest [${q.id}]: ${q.description}`;
}

export function formatNotFound(id: string): string {
  return `Quest [${id}] not found. IDs are random hex strings shown in brackets. Use the list action to see valid IDs.`;
}

export function formatBlockedBySubQuests(id: string): string {
  return `Quest [${id}] has incomplete sub-quests. A parent quest can only be marked done or deleted after all its sub-quests are complete. Toggle the sub-quests first, or delete them if they are no longer needed.`;
}

export function formatSubQuestCannotHaveSubQuests(id: string): string {
  return `Sub-quest [${id}] cannot have nested sub-quests. The quest system only supports one level of nesting. Use a top-level quest as the parent instead.`;
}

export function formatEmptyDescriptionsError(): string {
  return `Every description in a batch must be non-empty. Remove empty strings or split the batch into separate add calls.`;
}

export function formatMissingDescriptionsError(): string {
  return `At least one description is required for the add action. Provide a description string to create a quest.`;
}

export function formatIdRequiredError(action: string): string {
  return `An id is required for the ${action} action. Use the list action to see valid quest IDs. IDs are the hex strings shown in square brackets.`;
}

export function formatDescriptionRequiredError(): string {
  return `A description is required for the update action. Provide a non-empty string to update the quest.`;
}

export function formatTargetIdRequiredError(): string {
  return `A targetId is required for the reorder action. Provide the hex ID of the quest to insert before.`;
}

export function formatReorderNotFoundError(): string {
  return `Quest not found or is a sub-quest. Reorder only works on top-level quests. Use the list action to verify the ID and ensure it is a top-level quest.`;
}

export function formatParentNotFoundError(id: string): string {
  return `Parent quest [${id}] not found. Use the list action to see valid parent IDs.`;
}

export function formatParentDoneError(id: string): string {
  return `Cannot add a sub-quest to completed parent quest [${id}]. Sub-quests can only be added to open parents. Reopen the parent first if you need to add more work.`;
}

export function formatUnknownActionError(action: string): string {
  return `Unknown action: ${action}. Use the list action or check the tool schema for supported actions.`;
}

export function formatNothingToRevertError(): string {
  return `Nothing to revert. The history is empty because no mutating actions have been performed yet.`;
}

export function formatReorderedQuestNotFoundError(): string {
  return `Reordered quest not found. It may have been deleted or cleared since the reorder was recorded.`;
}
