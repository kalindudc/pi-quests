import type { AgentToolResult, Theme } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import type { ResolvedConfig } from "../config.js";
import { logger } from "../logger.js";
import type { Quest } from "../quest/types.js";
import { QUEST_ACTIONS } from "../quest/types.js";
import { formatQuestRow, formatSubQuestSpacerLine } from "./quests.js";

type QuestArgs = {
  action: string;
  descriptions?: string[];
  targetId?: string;
  id?: string;
  all?: boolean;
};

export function renderQuestCall(args: QuestArgs, theme: Theme, _context: unknown): Text {
  const id = "id" in args ? args.id : undefined;
  logger.debug("quests:tool", "renderCall", { action: args.action, id });
  const actionText =
    theme.fg("toolTitle", theme.bold("quest ")) +
    theme.fg("accent", args.action) +
    theme.fg("muted", args.targetId ? ` ${args.targetId}` : "");

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
    return new Text(`${actionText} ${theme.fg("muted", `[${args.id}]`)}`, 0, 0);
  }

  if (args.action === QUEST_ACTIONS.clear) {
    return new Text(`${actionText} ${theme.fg("muted", `[${args.all ? "all" : "done"}]`)}`, 0, 0);
  }

  return new Text(actionText, 0, 0);
}

export function renderQuestResult(config: ResolvedConfig) {
  return (
    result: AgentToolResult<unknown>,
    options: { expanded: boolean; isPartial: boolean },
    theme: Theme,
    _context: unknown,
  ): Text => {
    logger.debug("quests:tool", "renderResult", {
      expanded: options.expanded,
      isPartial: options.isPartial,
    });
    const details = result.details as Record<string, unknown> | undefined;
    const allQuests = details?.quests as Quest[] | undefined;
    const questsToRender = (details?.displayQuests ?? details?.quests) as Quest[] | undefined;

    if (
      !Array.isArray(questsToRender) ||
      questsToRender.length === 0 ||
      !Array.isArray(allQuests)
    ) {
      const text = result.content.map((c) => (c.type === "text" ? c.text : "[image]")).join("\n");
      return new Text(theme.fg("text", text), 0, 0);
    }

    const quests = allQuests;
    const renderedIds = new Set(questsToRender.map((q) => q.id));
    const parents = quests.filter((q) => !(q as Quest & { parentId?: string }).parentId);
    const lines: string[] = [];

    function getSubQuests(parentId: string) {
      return quests.filter((q) => (q as Quest & { parentId?: string }).parentId === parentId);
    }

    function willRenderLater(idx: number): boolean {
      for (let j = idx + 1; j < parents.length; j++) {
        const p = parents[j];
        if (renderedIds.has(p.id)) return true;

        const subs = getSubQuests(p.id).filter((sq) => renderedIds.has(sq.id));
        if (subs.length > 0) return true;
      }

      return false;
    }

    for (let i = 0; i < parents.length; i++) {
      const parent = parents[i];
      const parentIncluded = renderedIds.has(parent.id);
      const includedSubs = getSubQuests(parent.id).filter((sq) => renderedIds.has(sq.id));

      if (!parentIncluded && includedSubs.length === 0) continue;

      if (parentIncluded) {
        lines.push(formatQuestRow(theme, parent, config.ids.length, i + 1));
        if (includedSubs.length > 0) lines.push(formatSubQuestSpacerLine(theme, config.ids.length));
      }

      for (const sub of includedSubs) {
        lines.push(formatQuestRow(theme, sub, config.ids.length));
      }

      if (includedSubs.length > 0 && willRenderLater(i)) {
        lines.push("");
      }
    }

    return new Text(lines.join("\n"), 0, 0);
  };
}
