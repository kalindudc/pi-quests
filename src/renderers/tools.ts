import type { AgentToolResult, Theme } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { logger } from "../logger.js";

type QuestArgs = {
  action: string;
  description?: string;
  descriptions?: string[];
  id?: number;
};

export function renderQuestCall(args: QuestArgs, theme: Theme, _context: unknown): Text {
  logger.debug("quests:tool", "renderCall", { action: args.action, id: args.id });
  const actionText = theme.fg("toolTitle", theme.bold("quest ")) + theme.fg("accent", args.action);

  if (args.action === "add" && args.descriptions && args.descriptions.length > 0) {
    const n = args.descriptions.length;
    return new Text(
      `${actionText} ${theme.fg("muted", `[${n} quest${n !== 1 ? "s" : ""}]`)}`,
      0,
      0,
    );
  }

  if (args.action === "add" && args.description) {
    const preview =
      args.description.length > 60 ? `${args.description.slice(0, 60)}…` : args.description;
    return new Text(`${actionText} ${theme.fg("muted", preview)}`, 0, 0);
  }

  if (
    (args.action === "toggle" || args.action === "update" || args.action === "delete") &&
    args.id !== undefined
  ) {
    return new Text(`${actionText} ${theme.fg("muted", `#${args.id}`)}`, 0, 0);
  }

  if (args.action === "revert") {
    return new Text(actionText, 0, 0);
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
  const details = result.details as
    | { quests?: Array<{ id: number; description: string; done: boolean }> }
    | undefined;

  if (details?.quests && details.quests.length > 0) {
    const lines = details.quests.map((q) => {
      const marker = q.done ? theme.fg("success", "✓") : theme.fg("dim", "○");
      return `${marker} ${theme.fg("text", `#${q.id}`)} ${theme.fg("muted", q.description)}`;
    });
    return new Text(lines.join("\n"), 0, 0);
  }

  const text = result.content.map((c) => (c.type === "text" ? c.text : "[image]")).join("\n");
  return new Text(theme.fg("text", text), 0, 0);
}
