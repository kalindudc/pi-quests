import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Static } from "@sinclair/typebox";
import type { ResolvedConfig } from "../config.js";
import { logger } from "../logger.js";
import { QUEST_PROMPT_GATE, QUEST_PROMPT_REMINDER } from "../prompts.js";
import { makeToolResult, type QuestAction, type QuestLog } from "../quest/dataplane.js";
import { QUEST_ACTIONS } from "../quest/types.js";

const SPLIT_DISPLAY_ACTIONS = [
  QUEST_ACTIONS.add,
  QUEST_ACTIONS.list,
  QUEST_ACTIONS.split,
  QUEST_ACTIONS.add_step,
  QUEST_ACTIONS.revert,
] as const;

import { renderQuestCall, renderQuestResult } from "../renderers/tools.js";
import { createQuestParams, type QuestParamsType } from "./params.js";

type QuestToolParams = Static<QuestParamsType>;

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
  [QUEST_ACTIONS.split](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, {
      type: QUEST_ACTIONS.split,
      id: params.id,
      descriptions: params.descriptions,
    });
  },
  [QUEST_ACTIONS.add_step](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, {
      type: QUEST_ACTIONS.add_step,
      id: params.id,
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
  [QUEST_ACTIONS.clear](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.clear, all: params.all });
  },
  [QUEST_ACTIONS.reorder](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, {
      type: QUEST_ACTIONS.reorder,
      id: params.id,
      targetId: params.targetId,
    });
  },
  [QUEST_ACTIONS.reparent](questLog, params, toolCallId) {
    return runTool(questLog, toolCallId, {
      type: QUEST_ACTIONS.reparent,
      id: params.id,
      parentId: params.parentId,
    });
  },
  [QUEST_ACTIONS.rules](questLog, _params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.rules });
  },
  [QUEST_ACTIONS.skill](questLog, _params, toolCallId) {
    return runTool(questLog, toolCallId, { type: QUEST_ACTIONS.skill });
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

  const displayQuests = SPLIT_DISPLAY_ACTIONS.includes(
    action.type as (typeof SPLIT_DISPLAY_ACTIONS)[number],
  )
    ? questLog.getAll()
    : result.quest
      ? [result.quest]
      : undefined;

  return makeToolResult(result.message, questLog, displayQuests);
}

export async function questToolExecute(
  questLog: QuestLog,
  toolCallId: string,
  params: QuestToolParams,
): Promise<AgentToolResult<unknown>> {
  logger.debug("quests:tool", "execute", { toolCallId, action: params.action, id: params.id });
  const handler = toolHandlers[params.action];
  return handler(questLog, params, toolCallId);
}

export function registerQuestTool(
  pi: ExtensionAPI,
  questLog: QuestLog,
  config: ResolvedConfig,
): void {
  logger.debug("quests:tool", "register");
  pi.registerTool({
    name: "quest",
    label: "Quest",
    description:
      "Manage the session quest log and retrieve the complete quest system documentation. " +
      "Use this VERY frequently to track tasks, plans, and progress. " +
      "When you need to understand quests, steps, rules, or best practices, use action: 'skill' or action: 'rules'.",
    promptSnippet:
      "Manage quests and steps, or retrieve quest rules and best practices via skill/rules",
    promptGuidelines: [...QUEST_PROMPT_GATE, ...QUEST_PROMPT_REMINDER],
    parameters: createQuestParams(config.ids.length),
    execute: (toolCallId, params, _signal, _onUpdate, _ctx) =>
      questToolExecute(questLog, toolCallId, params),
    renderCall: renderQuestCall,
    renderResult: renderQuestResult(config),
  });
}
