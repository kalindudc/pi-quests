import { StringEnum } from "@mariozechner/pi-ai";
import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { type Static, Type } from "@sinclair/typebox";
import { logger } from "../logger.js";
import {
  formatBatchAddResult,
  formatClearResult,
  formatDeleteResult,
  formatNotFound,
  formatQuestList,
  formatToggleResult,
  formatUpdateResult,
  makeToolResult,
  type QuestLog,
} from "../quests.js";
import { renderQuestCall, renderQuestResult } from "../renderers/tools.js";

export const QuestParams = Type.Object({
  action: StringEnum(["add", "list", "toggle", "update", "delete", "clear", "revert"] as const),
  description: Type.Optional(Type.String()),
  descriptions: Type.Optional(Type.Array(Type.String())),
  id: Type.Optional(Type.Number()),
});

export async function questToolExecute(
  questLog: QuestLog,
  toolCallId: string,
  params: Static<typeof QuestParams>,
): Promise<AgentToolResult<unknown>> {
  logger.debug("quests:tool", "execute", { toolCallId, action: params.action, id: params.id });

  switch (params.action) {
    case "add": {
      if (params.descriptions && params.descriptions.length > 0) {
        logger.debug("quests:tool", "add-batch", { count: params.descriptions.length, toolCallId });
        const added: { id: number; description: string }[] = [];
        for (const desc of params.descriptions) {
          const q = questLog.add(desc);
          added.push({ id: q.id, description: q.description });
        }
        logger.debug("quests:tool", "add-batch-complete", { toolCallId, added: added.length });
        return makeToolResult(formatBatchAddResult(added), questLog);
      }
      if (!params.description) {
        logger.debug("quests:tool", "add-missing-description", { toolCallId });
        return makeToolResult("Error: description is required for add action", questLog);
      }
      const q = questLog.add(params.description);
      logger.debug("quests:tool", "add-complete", { toolCallId, id: q.id });
      return makeToolResult(`Added quest #${q.id}: ${q.description}`, questLog);
    }
    case "list": {
      const quests = questLog.getAll();
      logger.debug("quests:tool", "list", { toolCallId, count: quests.length });
      return makeToolResult(formatQuestList(quests), questLog);
    }
    case "toggle": {
      if (params.id === undefined) {
        logger.debug("quests:tool", "toggle-missing-id", { toolCallId });
        return makeToolResult("Error: id is required for toggle action", questLog);
      }
      const q = questLog.toggle(params.id);
      if (!q) {
        logger.debug("quests:tool", "toggle-not-found", { toolCallId, id: params.id });
        return makeToolResult(formatNotFound(params.id), questLog);
      }
      logger.debug("quests:tool", "toggle-complete", {
        toolCallId,
        id: params.id,
        state: q.done,
      });
      return makeToolResult(formatToggleResult(params.id, q.done), questLog);
    }
    case "update": {
      if (params.id === undefined) {
        logger.debug("quests:tool", "update-missing-id", { toolCallId });
        return makeToolResult("Error: id is required for update action", questLog);
      }
      if (!params.description) {
        logger.debug("quests:tool", "update-missing-description", { toolCallId, id: params.id });
        return makeToolResult("Error: description is required for update action", questLog);
      }
      const q = questLog.update(params.id, params.description);
      if (!q) {
        logger.debug("quests:tool", "update-not-found", { toolCallId, id: params.id });
        return makeToolResult(formatNotFound(params.id), questLog);
      }
      logger.debug("quests:tool", "update-complete", { toolCallId, id: params.id });
      return makeToolResult(formatUpdateResult(q), questLog);
    }
    case "delete": {
      if (params.id === undefined) {
        logger.debug("quests:tool", "delete-missing-id", { toolCallId });
        return makeToolResult("Error: id is required for delete action", questLog);
      }
      const q = questLog.delete(params.id);
      if (!q) {
        logger.debug("quests:tool", "delete-not-found", { toolCallId, id: params.id });
        return makeToolResult(formatNotFound(params.id), questLog);
      }
      logger.debug("quests:tool", "delete-complete", { toolCallId, id: params.id });
      return makeToolResult(formatDeleteResult(q), questLog);
    }
    case "clear": {
      const count = questLog.clear();
      logger.debug("quests:tool", "clear-complete", { toolCallId, count });
      return makeToolResult(formatClearResult(count), questLog);
    }
    case "revert": {
      const result = questLog.revert();
      logger.debug("quests:tool", "revert-complete", { toolCallId, success: result.success });
      return makeToolResult(result.message, questLog);
    }
    default: {
      logger.debug("quests:tool", "unknown-action", {
        toolCallId,
        action: (params as { action: string }).action,
      });
      return makeToolResult(`Unknown action: ${(params as { action: string }).action}`, questLog);
    }
  }
}

export function registerQuestTool(pi: ExtensionAPI, questLog: QuestLog): void {
  logger.debug("quests:tool", "register");
  pi.registerTool({
    name: "quest",
    label: "Quest",
    description: "Manage the session quest log",
    parameters: QuestParams,
    execute: (toolCallId, params, _signal, _onUpdate, _ctx) =>
      questToolExecute(questLog, toolCallId, params),
    renderCall: renderQuestCall,
    renderResult: renderQuestResult,
  });
}
