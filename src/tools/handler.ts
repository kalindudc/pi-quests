import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Static } from "@sinclair/typebox";
import { logger } from "../logger.js";
import { makeToolResult, type QuestAction, type QuestLog } from "../quest/dataplane.js";
import { QUEST_ACTIONS } from "../quest/types.js";
import { renderQuestCall, renderQuestResult } from "../renderers/tools.js";
import { QuestParams } from "./params.js";

type QuestToolParams = Static<typeof QuestParams>;

const toolHandlers: {
  [K in QuestToolParams["action"]]: (
    questLog: QuestLog,
    params: QuestToolParams,
    toolCallId: string,
  ) => AgentToolResult<unknown>;
} = {
  [QUEST_ACTIONS.add](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, {
      type: QUEST_ACTIONS.add,
      descriptions: params.descriptions,
    });
  },
  [QUEST_ACTIONS.list](questLog, _params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.list });
  },
  [QUEST_ACTIONS.toggle](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.toggle, id: params.id });
  },
  [QUEST_ACTIONS.update](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, {
      type: QUEST_ACTIONS.update,
      id: params.id,
      description: params.description,
    });
  },
  [QUEST_ACTIONS.delete](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.delete, id: params.id });
  },
  [QUEST_ACTIONS.clear](questLog, _params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.clear });
  },
  [QUEST_ACTIONS.revert](questLog, _params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.revert });
  },
};

function runTool(
  questLog: QuestLog,
  toolCallId: string,
  action: QuestAction,
): AgentToolResult<unknown> {
  const result = questLog.execute(action);
  logger.debug("quests:tool", "execute-complete", { toolCallId, success: result.success });
  return makeToolResult(result.message, questLog);
}

export async function questToolExecute(
  questLog: QuestLog,
  toolCallId: string,
  params: Static<typeof QuestParams>,
): Promise<AgentToolResult<unknown>> {
  logger.debug("quests:tool", "execute", { toolCallId, action: params.action, id: params.id });
  const handler = toolHandlers[params.action];
  return handler(questLog, params, toolCallId);
}

export function registerQuestTool(pi: ExtensionAPI, questLog: QuestLog): void {
  logger.debug("quests:tool", "register");
  pi.registerTool({
    name: "quest",
    label: "Quest",
    description:
      "Manage the session quest log. Use this VERY frequently to track tasks, plans, and progress throughout the conversation.",
    promptSnippet: "Add, list, toggle, update, delete, clear, or revert quest items",
    promptGuidelines: [
      "Before reading files, running commands, or making edits, ensure the current work is tracked as specific, actionable quests.",
      "Do not create a single vague quest for broad requests. Break them into concrete, independent steps.",
      "When the user gives a plan or a list of tasks, add them as quests immediately.",
      "It is critical that you toggle quests to done as soon as you complete them. Do NOT batch completions.",
      "Before delegating to a minion, add a quest for the delegated task.",
      "If you are unsure what to do next, use the list action to check active quests.",
    ],
    parameters: QuestParams,
    execute: (toolCallId, params, _signal, _onUpdate, _ctx) =>
      questToolExecute(questLog, toolCallId, params),
    renderCall: renderQuestCall,
    renderResult: renderQuestResult,
  });
}
