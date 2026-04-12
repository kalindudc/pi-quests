export function formatQuestList(
  quests: { id: string; description: string; done: boolean }[],
): string {
  if (quests.length === 0) return "No quests.";

  return quests
    .map((q, i) => `#${i + 1} [${q.id}] [${q.done ? "x" : " "}] ${q.description}`)
    .join("\n");
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
