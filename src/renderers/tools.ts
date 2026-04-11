import type { AgentToolResult, Theme } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { logger } from "../logger.js";
import { QUEST_ACTIONS } from "../quest/types.js";

type QuestArgs = {
  action: string;
  descriptions?: string[];
  id?: number;
};

export function renderQuestCall(args: QuestArgs, theme: Theme, _context: unknown): Text {
  const id = "id" in args ? args.id : undefined;
  logger.debug("quests:tool", "renderCall", { action: args.action, id });
  const actionText = theme.fg("toolTitle", theme.bold("quest ")) + theme.fg("accent", args.action);

  if (args.action === QUEST_ACTIONS.add && args.descriptions && args.descriptions.length > 0) {
    const n = args.descriptions.length;
    return new Text(
      `${actionText} ${theme.fg("muted", `[${n} quest${n !== 1 ? "s" : ""}]`)}`,
      0,
      0,
    );
  }

  if (
    (args.action === QUEST_ACTIONS.toggle ||
      args.action === QUEST_ACTIONS.update ||
      args.action === QUEST_ACTIONS.delete) &&
    args.id !== undefined
  ) {
    return new Text(`${actionText} ${theme.fg("muted", `#${args.id}`)}`, 0, 0);
  }

  return new Text(actionText, 0, 0);
}

export function renderQuestResult(
  result: AgentToolResult<unknown>,
  options: { expanded: boolean; isPartial: boolean },
  theme: Theme,
  _context: unknown,
): Text {
  logger.debug("quests:tool", "renderResult", {
    expanded: options.expanded,
    isPartial: options.isPartial,
  });
  const details = result.details as Record<string, unknown> | undefined;
  const allQuests =
    (details?.quests as Array<{ id: number; description: string; done: boolean }> | undefined) ??
    [];
  const questsToRender = (details?.displayQuests ?? details?.quests) as
    | Array<{ id: number; description: string; done: boolean }>
    | undefined;

  if (Array.isArray(questsToRender) && questsToRender.length > 0) {
    const lines = questsToRender.map((q) => {
      const pos = allQuests.findIndex((x) => x.id === q.id) + 1 || 1;
      const marker = q.done ? theme.fg("success", "✓") : theme.fg("dim", "○");

      return `${marker} ${theme.fg("text", `#${pos}`)} ${theme.fg("muted", q.description)}`;
    });

    return new Text(lines.join("\n"), 0, 0);
  }

  const text = result.content.map((c) => (c.type === "text" ? c.text : "[image]")).join("\n");
  return new Text(theme.fg("text", text), 0, 0);
}
