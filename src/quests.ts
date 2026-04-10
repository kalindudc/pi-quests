import type { AgentToolResult, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { logger } from "./logger.js";

export interface Quest {
  id: number;
  description: string;
  additionalContext?: string;
  done: boolean;
  createdAt: number;
}

type HistoryEntry =
  | { type: "add"; id: number }
  | { type: "toggle"; id: number }
  | { type: "update"; id: number; previousDescription: string }
  | { type: "delete"; quest: Quest; index: number }
  | { type: "clear"; quests: Quest[]; nextId: number };

export class QuestLog {
  private quests: Quest[] = [];
  private nextId = 1;
  private history: HistoryEntry[] = [];

  getAll(): Quest[] {
    return [...this.quests];
  }

  getNextId(): number {
    return this.nextId;
  }

  add(description: string, additionalContext?: string): Quest {
    const quest: Quest = {
      id: this.nextId++,
      description,
      additionalContext,
      done: false,
      createdAt: Date.now(),
    };
    this.quests.push(quest);
    this.history.push({ type: "add", id: quest.id });
    logger.debug("quests:state", "add", { id: quest.id, description, total: this.quests.length });
    return quest;
  }

  toggle(id: number): Quest | undefined {
    const quest = this.quests.find((q) => q.id === id);
    if (!quest) {
      logger.debug("quests:state", "toggle-not-found", { id });
      return undefined;
    }
    quest.done = !quest.done;
    this.history.push({ type: "toggle", id });
    logger.debug("quests:state", "toggle", { id, done: quest.done, total: this.quests.length });
    return quest;
  }

  update(id: number, description: string): Quest | undefined {
    const quest = this.quests.find((q) => q.id === id);
    if (!quest) {
      logger.debug("quests:state", "update-not-found", { id });
      return undefined;
    }
    this.history.push({ type: "update", id, previousDescription: quest.description });
    quest.description = description;
    logger.debug("quests:state", "update", { id, description, total: this.quests.length });
    return quest;
  }

  delete(id: number): Quest | undefined {
    const index = this.quests.findIndex((q) => q.id === id);
    if (index === -1) {
      logger.debug("quests:state", "delete-not-found", { id });
      return undefined;
    }
    const [quest] = this.quests.splice(index, 1);
    this.history.push({ type: "delete", quest, index });
    logger.debug("quests:state", "delete", { id, index, total: this.quests.length });
    return quest;
  }

  clear(): number {
    const count = this.quests.length;
    this.history.push({ type: "clear", quests: [...this.quests], nextId: this.nextId });
    this.quests = [];
    this.nextId = 1;
    logger.debug("quests:state", "clear", { count });
    return count;
  }

  revert(): { success: boolean; message: string } {
    const entry = this.history.pop();
    if (!entry) {
      logger.debug("quests:state", "revert-empty");
      return { success: false, message: "Nothing to revert" };
    }

    logger.debug("quests:state", "revert", { type: entry.type });

    if (entry.type === "add") {
      this.quests = this.quests.filter((q) => q.id !== entry.id);
      const maxId = this.quests.reduce((max, q) => Math.max(max, q.id), 0);
      this.nextId = Math.max(maxId + 1, entry.id);
      logger.debug("quests:state", "revert-add", { id: entry.id, total: this.quests.length });
      return { success: true, message: `Reverted add quest #${entry.id}` };
    }

    if (entry.type === "toggle") {
      const quest = this.quests.find((q) => q.id === entry.id);
      if (quest) {
        quest.done = !quest.done;
        logger.debug("quests:state", "revert-toggle", { id: entry.id, done: quest.done });
        return { success: true, message: `Reverted toggle for quest #${entry.id}` };
      }
      logger.debug("quests:state", "revert-toggle-not-found", { id: entry.id });
      return { success: false, message: `Quest #${entry.id} not found` };
    }

    if (entry.type === "update") {
      const quest = this.quests.find((q) => q.id === entry.id);
      if (quest) {
        quest.description = entry.previousDescription;
        logger.debug("quests:state", "revert-update", { id: entry.id });
        return { success: true, message: `Reverted update for quest #${entry.id}` };
      }
      logger.debug("quests:state", "revert-update-not-found", { id: entry.id });
      return { success: false, message: `Quest #${entry.id} not found` };
    }

    if (entry.type === "delete") {
      this.quests.splice(entry.index, 0, entry.quest);
      logger.debug("quests:state", "revert-delete", {
        id: entry.quest.id,
        index: entry.index,
        total: this.quests.length,
      });
      return { success: true, message: `Reverted delete for quest #${entry.quest.id}` };
    }

    if (entry.type === "clear") {
      this.quests = [...entry.quests];
      this.nextId = entry.nextId;
      logger.debug("quests:state", "revert-clear", { count: entry.quests.length });
      return { success: true, message: `Reverted clear (${entry.quests.length} quests restored)` };
    }

    logger.debug("quests:state", "revert-unknown", { type: (entry as { type: string }).type });
    return { success: false, message: "Unknown history entry" };
  }

  reconstructFromSession(ctx: ExtensionContext): void {
    const branch = ctx.sessionManager.getBranch();
    let lastState: { quests?: Quest[]; nextId?: number } | undefined;
    let toolResults = 0;

    for (const entry of branch) {
      if (
        entry.type === "message" &&
        "message" in entry &&
        entry.message.role === "toolResult" &&
        entry.message.toolName === "quest"
      ) {
        toolResults++;
        lastState = entry.message.details as { quests?: Quest[]; nextId?: number } | undefined;
      }
    }

    if (lastState) {
      const questCount = Array.isArray(lastState.quests) ? lastState.quests.length : 0;
      this.quests = Array.isArray(lastState.quests) ? [...lastState.quests] : [];
      this.nextId = typeof lastState.nextId === "number" ? lastState.nextId : 1;
      logger.debug("quests:state", "reconstruct", { toolResults, questCount, nextId: this.nextId });
    } else {
      this.quests = [];
      this.nextId = 1;
      logger.debug("quests:state", "reconstruct-empty", { toolResults });
    }
    this.history = [];
  }
}

export function makeToolResult(text: string, questLog: QuestLog): AgentToolResult<unknown> {
  return {
    content: [{ type: "text", text }],
    details: { quests: questLog.getAll(), nextId: questLog.getNextId() },
  };
}

export function formatQuestList(
  quests: { id: number; description: string; done: boolean }[],
): string {
  if (quests.length === 0) return "No quests.";
  return quests.map((q) => `#${q.id} [${q.done ? "x" : " "}] ${q.description}`).join("\n");
}

export function formatAddResult(q: { id: number; description: string }): string {
  return `Added quest #${q.id}: ${q.description}`;
}

export function formatBatchAddResult(added: { id: number; description: string }[]): string {
  return `Added ${added.length} quests:\n${added.map((q) => `#${q.id}: ${q.description}`).join("\n")}`;
}

export function formatToggleResult(id: number, done: boolean): string {
  return `Quest #${id} ${done ? "done" : "undone"}`;
}

export function formatUpdateResult(q: { id: number; description: string }): string {
  return `Updated quest #${q.id}: ${q.description}`;
}

export function formatDeleteResult(q: { id: number; description: string }): string {
  return `Deleted quest #${q.id}: ${q.description}`;
}

export function formatClearResult(count: number): string {
  return `Cleared ${count} quests`;
}

export function formatNotFound(id: number): string {
  return `Quest #${id} not found`;
}
