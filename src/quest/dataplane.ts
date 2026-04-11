import type { AgentToolResult, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { logger } from "../logger.js";
import {
  formatAddResult,
  formatBatchAddResult,
  formatClearResult,
  formatDeleteResult,
  formatNotFound,
  formatQuestList,
  formatToggleResult,
  formatUpdateResult,
} from "./formatters.js";
import { QUEST_ACTIONS, type Quest } from "./types.js";

export type HistoryEntry =
  | { type: typeof QUEST_ACTIONS.add; id: number }
  | { type: typeof QUEST_ACTIONS.toggle; id: number }
  | { type: typeof QUEST_ACTIONS.update; id: number; previousDescription: string }
  | { type: typeof QUEST_ACTIONS.delete; quest: Quest; index: number }
  | { type: typeof QUEST_ACTIONS.clear; quests: Quest[]; nextId: number };

export type QuestAction =
  | { type: typeof QUEST_ACTIONS.add; description?: string; descriptions?: string[] }
  | { type: typeof QUEST_ACTIONS.list }
  | { type: typeof QUEST_ACTIONS.toggle; id?: number }
  | { type: typeof QUEST_ACTIONS.update; id?: number; description?: string }
  | { type: typeof QUEST_ACTIONS.delete; id?: number }
  | { type: typeof QUEST_ACTIONS.clear }
  | { type: typeof QUEST_ACTIONS.revert };

export type QuestOperationResult = { success: boolean; message: string };

/**
 * In-memory quest data plane.
 *
 * Holds quest state, mutation history, and exposes `execute()` as the
 * single entry point for all adapter layers (commands, tools, etc.).
 */
export class QuestLog {
  private quests: Quest[] = [];
  private nextId = 1;
  private history: HistoryEntry[] = [];
  private undoHandlers: {
    [K in HistoryEntry["type"]]: (entry: Extract<HistoryEntry, { type: K }>) => {
      success: boolean;
      message: string;
    };
  } = {
    [QUEST_ACTIONS.add]: (entry) => {
      this.quests = this.quests.filter((q) => q.id !== entry.id);

      const maxId = this.quests.reduce((max, q) => Math.max(max, q.id), 0);
      this.nextId = Math.max(maxId + 1, entry.id);

      logger.debug("quests:state", "revert-add", { id: entry.id, total: this.quests.length });
      return { success: true, message: `Reverted add quest #${entry.id}` };
    },
    [QUEST_ACTIONS.toggle]: (entry) => {
      const quest = this.quests.find((q) => q.id === entry.id);

      if (quest) {
        quest.done = !quest.done;
        logger.debug("quests:state", "revert-toggle", { id: entry.id, done: quest.done });
        return { success: true, message: `Reverted toggle for quest #${entry.id}` };
      }

      logger.debug("quests:state", "revert-toggle-not-found", { id: entry.id });
      return { success: false, message: `Quest #${entry.id} not found` };
    },
    [QUEST_ACTIONS.update]: (entry) => {
      const quest = this.quests.find((q) => q.id === entry.id);
      if (quest) {
        quest.description = entry.previousDescription;
        logger.debug("quests:state", "revert-update", { id: entry.id });
        return { success: true, message: `Reverted update for quest #${entry.id}` };
      }

      logger.debug("quests:state", "revert-update-not-found", { id: entry.id });
      return { success: false, message: `Quest #${entry.id} not found` };
    },
    [QUEST_ACTIONS.delete]: (entry) => {
      this.quests.splice(entry.index, 0, entry.quest);

      logger.debug("quests:state", "revert-delete", {
        id: entry.quest.id,
        index: entry.index,
        total: this.quests.length,
      });
      return { success: true, message: `Reverted delete for quest #${entry.quest.id}` };
    },
    [QUEST_ACTIONS.clear]: (entry) => {
      this.quests = [...entry.quests];
      this.nextId = entry.nextId;

      logger.debug("quests:state", "revert-clear", { count: entry.quests.length });
      return { success: true, message: `Reverted clear (${entry.quests.length} quests restored)` };
    },
  };

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
    this.history.push({ type: QUEST_ACTIONS.add, id: quest.id });

    logger.debug("quests:state", QUEST_ACTIONS.add, {
      id: quest.id,
      description,
      total: this.quests.length,
    });
    return quest;
  }

  toggle(id: number): Quest | undefined {
    const quest = this.quests.find((q) => q.id === id);
    if (!quest) {
      logger.debug("quests:state", "toggle-not-found", { id });
      return undefined;
    }

    quest.done = !quest.done;
    this.history.push({ type: QUEST_ACTIONS.toggle, id });

    logger.debug("quests:state", QUEST_ACTIONS.toggle, {
      id,
      done: quest.done,
      total: this.quests.length,
    });
    return quest;
  }

  update(id: number, description: string): Quest | undefined {
    const quest = this.quests.find((q) => q.id === id);
    if (!quest) {
      logger.debug("quests:state", "update-not-found", { id });
      return undefined;
    }

    this.history.push({ type: QUEST_ACTIONS.update, id, previousDescription: quest.description });
    quest.description = description;

    logger.debug("quests:state", QUEST_ACTIONS.update, {
      id,
      description,
      total: this.quests.length,
    });
    return quest;
  }

  delete(id: number): Quest | undefined {
    const index = this.quests.findIndex((q) => q.id === id);
    if (index === -1) {
      logger.debug("quests:state", "delete-not-found", { id });
      return undefined;
    }

    const [quest] = this.quests.splice(index, 1);
    this.history.push({ type: QUEST_ACTIONS.delete, quest, index });

    logger.debug("quests:state", QUEST_ACTIONS.delete, { id, index, total: this.quests.length });
    return quest;
  }

  clear(): number {
    const count = this.quests.length;
    this.history.push({ type: QUEST_ACTIONS.clear, quests: [...this.quests], nextId: this.nextId });
    this.quests = [];
    this.nextId = 1;

    logger.debug("quests:state", QUEST_ACTIONS.clear, { count });
    return count;
  }

  revert(): QuestOperationResult {
    const entry = this.history.pop();
    if (!entry) {
      logger.debug("quests:state", "revert-empty");
      return { success: false, message: "Nothing to revert" };
    }

    logger.debug("quests:state", "revert", { type: entry.type });

    const handler = this.undoHandlers[entry.type];
    if (handler) {
      return handler(entry as never);
    }

    logger.debug("quests:state", "revert-unknown", { type: (entry as { type: string }).type });
    return { success: false, message: "Unknown history entry" };
  }

  /**
   * Execute a quest action and return a presentation-ready result.
   * This is the primary API for all adapter layers (commands, tools).
   */
  execute(action: QuestAction): QuestOperationResult {
    switch (action.type) {
      case QUEST_ACTIONS.add: {
        if (action.descriptions && action.descriptions.length > 0) {
          if (action.descriptions.some((d) => !d || d.trim().length === 0)) {
            return {
              success: false,
              message: "Error: all descriptions in a batch must be non-empty",
            };
          }
          const added: { id: number; description: string }[] = [];
          for (const desc of action.descriptions) {
            const q = this.add(desc);
            added.push({ id: q.id, description: q.description });
          }

          return { success: true, message: formatBatchAddResult(added) };
        }
        if (!action.description) {
          return { success: false, message: "Error: description is required for add action" };
        }

        const q = this.add(action.description);
        return { success: true, message: formatAddResult(q) };
      }
      case QUEST_ACTIONS.list: {
        const quests = this.getAll();
        return { success: true, message: formatQuestList(quests) };
      }
      case QUEST_ACTIONS.toggle: {
        if (action.id === undefined) {
          return { success: false, message: "Error: id is required for toggle action" };
        }

        const q = this.toggle(action.id);
        if (!q) {
          return { success: false, message: formatNotFound(action.id) };
        }

        return { success: true, message: formatToggleResult(action.id, q.done) };
      }
      case QUEST_ACTIONS.update: {
        if (action.id === undefined) {
          return { success: false, message: "Error: id is required for update action" };
        }

        if (!action.description) {
          return { success: false, message: "Error: description is required for update action" };
        }

        const q = this.update(action.id, action.description);
        if (!q) {
          return { success: false, message: formatNotFound(action.id) };
        }

        return { success: true, message: formatUpdateResult(q) };
      }
      case QUEST_ACTIONS.delete: {
        if (action.id === undefined) {
          return { success: false, message: "Error: id is required for delete action" };
        }

        const q = this.delete(action.id);
        if (!q) {
          return { success: false, message: formatNotFound(action.id) };
        }

        return { success: true, message: formatDeleteResult(q) };
      }
      case QUEST_ACTIONS.clear: {
        const count = this.clear();
        return { success: true, message: formatClearResult(count) };
      }
      case QUEST_ACTIONS.revert: {
        return this.revert();
      }
      default: {
        return { success: false, message: `Unknown action: ${(action as { type: string }).type}` };
      }
    }
  }

  reconstructFromSession(ctx: ExtensionContext): void {
    const branch = ctx.sessionManager.getBranch();
    let lastState: Record<string, unknown> | undefined;
    let toolResults = 0;

    for (const entry of branch) {
      if (
        entry.type === "message" &&
        "message" in entry &&
        entry.message.role === "toolResult" &&
        entry.message.toolName === "quest"
      ) {
        toolResults++;
        lastState = entry.message.details;
      }
    }

    if (lastState) {
      const quests = lastState.quests;
      const nextId = lastState.nextId;
      const questCount = Array.isArray(quests) ? quests.length : 0;

      this.quests = Array.isArray(quests) ? [...(quests as Quest[])] : [];
      this.nextId = typeof nextId === "number" ? nextId : 1;
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
