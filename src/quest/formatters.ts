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
  return `Quest [${id}] not found`;
}

export function formatBlockedBySubQuests(id: string): string {
  return `Quest [${id}] has incomplete sub-quests`;
}

export function formatSubQuestCannotHaveSubQuests(id: string): string {
  return `Sub-quest [${id}] cannot have nested sub-quests`;
}
