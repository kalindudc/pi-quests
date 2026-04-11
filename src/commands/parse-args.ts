import { logger } from "../logger.js";
import { QUEST_ACTIONS } from "../quest/types.js";

export type ParsedArgs =
  | { action: typeof QUEST_ACTIONS.add; descriptions: string[] }
  | { action: typeof QUEST_ACTIONS.list }
  | { action: typeof QUEST_ACTIONS.toggle; id: number }
  | { action: typeof QUEST_ACTIONS.update; id: number; description: string }
  | { action: typeof QUEST_ACTIONS.delete; id: number }
  | { action: typeof QUEST_ACTIONS.clear; all?: boolean }
  | { action: typeof QUEST_ACTIONS.reorder; id: number; targetIndex: number }
  | { action: typeof QUEST_ACTIONS.revert }
  | { action: "help" }
  | { action: "version" }
  | { action: "changelog" }
  | { error: string };

/**
 * Parse user input from the /quests command into structured arguments.
 */
export function parseQuestArgs(args: string): ParsedArgs {
  logger.debug("quests:cmd", "parse-args", { args });
  const tokens = args.trim().split(/\s+/).filter(Boolean);

  // Empty input defaults to listing quests.
  if (tokens.length === 0) {
    logger.debug("quests:cmd", "parse-args-empty", { action: QUEST_ACTIONS.list });
    return { action: QUEST_ACTIONS.list };
  }

  const [command, ...rest] = tokens;

  // Meta commands
  if (command === "version") return { action: "version" };
  if (command === "changelog") return { action: "changelog" };
  if (command === "help" || command === "h") return { action: "help" };

  // Quest actions without arguments
  if (command === QUEST_ACTIONS.list) return { action: QUEST_ACTIONS.list };
  if (command === QUEST_ACTIONS.clear) return parseClearArgs(rest);
  if (command === QUEST_ACTIONS.revert) return { action: QUEST_ACTIONS.revert };

  // Quest actions with arguments
  if (command === QUEST_ACTIONS.add) return parseAddArgs(rest);
  if (command === QUEST_ACTIONS.toggle) return parseIdAction(QUEST_ACTIONS.toggle, rest);
  if (command === QUEST_ACTIONS.delete) return parseIdAction(QUEST_ACTIONS.delete, rest);
  if (command === QUEST_ACTIONS.update) return parseUpdateArgs(rest);
  if (command === QUEST_ACTIONS.reorder) return parseReorderArgs(rest);

  return { error: `Unknown subcommand: ${command}. Use /quests help to see available commands.` };
}

function parseAddArgs(tokens: string[]): ParsedArgs {
  const description = tokens.join(" ").trim();
  if (!description) return { error: "Usage: /quests add <description>" };

  return { action: QUEST_ACTIONS.add, descriptions: [description] };
}

function parseIdAction(
  action: typeof QUEST_ACTIONS.toggle | typeof QUEST_ACTIONS.delete,
  tokens: string[],
): ParsedArgs {
  const idStr = tokens[0];
  const id = idStr ? Number(idStr) : NaN;
  if (Number.isNaN(id)) return { error: `Usage: /quests ${action} <id>` };

  return { action, id };
}

function parseUpdateArgs(tokens: string[]): ParsedArgs {
  const idStr = tokens[0];
  const id = idStr ? Number(idStr) : NaN;
  if (Number.isNaN(id)) return { error: "Usage: /quests update <id> <description>" };

  const description = tokens.slice(1).join(" ").trim();
  if (!description) return { error: "Usage: /quests update <id> <description>" };

  return { action: QUEST_ACTIONS.update, id, description };
}

function parseClearArgs(tokens: string[]): ParsedArgs {
  const all = tokens[0] === "all";
  if (tokens.length > 0 && !all) return { error: "Usage: /quests clear [all]" };
  return { action: QUEST_ACTIONS.clear, all };
}

function parseReorderArgs(tokens: string[]): ParsedArgs {
  const id = Number(tokens[0]);
  const targetIndex = Number(tokens[1]);
  if (Number.isNaN(id) || Number.isNaN(targetIndex))
    return { error: "Usage: /quests reorder <id> <index>" };
  return { action: QUEST_ACTIONS.reorder, id, targetIndex };
}
