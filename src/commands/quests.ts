import { readFileSync } from "node:fs";
import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { logger } from "../logger.js";
import {
  formatClearResult,
  formatDeleteResult,
  formatNotFound,
  formatToggleResult,
  formatUpdateResult,
  type QuestLog,
} from "../quests.js";
import { QuestListWidget } from "../renderers/commands.js";
import { CHANGELOG_PATH, VERSION } from "../version.js";

// Helper function to reverse changelog sections so newest appears first
function reverseChangelog(content: string): string {
  const lines = content.split("\n");
  const sections: string[][] = [];
  let currentSection: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## [")) {
      if (currentSection.length > 0) {
        sections.push(currentSection);
      }
      currentSection = [line];
    } else {
      currentSection.push(line);
    }
  }

  if (currentSection.length > 0) {
    sections.push(currentSection);
  }

  // Reverse sections and flatten
  const reversed = sections.reverse().flat();
  return reversed.join("\n");
}

export type ParsedArgs =
  | { action: "add"; description: string }
  | { action: "list" }
  | { action: "toggle"; id: number }
  | { action: "update"; id: number; description: string }
  | { action: "delete"; id: number }
  | { action: "clear" }
  | { action: "revert" }
  | { action: "help" }
  | { action: "version" }
  | { action: "changelog" }
  | { error: string };

export function parseQuestArgs(args: string): ParsedArgs {
  logger.debug("quests:cmd", "parse-args", { args });
  const tokens = args.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    logger.debug("quests:cmd", "parse-args-empty", { action: "list" });
    return { action: "list" };
  }
  const action = tokens[0];
  if (action === "version") return { action: "version" };
  if (action === "changelog") return { action: "changelog" };
  if (action === "help" || action === "h") return { action: "help" };
  if (action === "list") return { action: "list" };
  if (action === "clear") return { action: "clear" };
  if (action === "revert") return { action: "revert" };
  if (action === "add") {
    const description = tokens.slice(1).join(" ").trim();
    if (!description) return { error: "Usage: /quests add <description>" };
    return { action: "add", description };
  }
  if (action === "toggle") {
    const idStr = tokens[1];
    const id = idStr ? Number(idStr) : NaN;
    if (Number.isNaN(id)) return { error: "Usage: /quests toggle <id>" };
    return { action: "toggle", id };
  }
  if (action === "delete") {
    const idStr = tokens[1];
    const id = idStr ? Number(idStr) : NaN;
    if (Number.isNaN(id)) return { error: "Usage: /quests delete <id>" };
    return { action: "delete", id };
  }
  if (action === "update") {
    const idStr = tokens[1];
    const id = idStr ? Number(idStr) : NaN;
    if (Number.isNaN(id)) return { error: "Usage: /quests update <id> <description>" };
    const description = tokens.slice(2).join(" ").trim();
    if (!description) return { error: "Usage: /quests update <id> <description>" };
    return { action: "update", id, description };
  }
  return { error: `Unknown subcommand: ${action}. Use /quests help to see available commands.` };
}

export function createQuestsHandler(pi: ExtensionAPI, questLog: QuestLog) {
  return async function handler(args: string, ctx: ExtensionCommandContext): Promise<void> {
    logger.debug("quests:cmd", "handler", { args, hasUI: ctx.hasUI });
    const parsed = parseQuestArgs(args);
    if ("error" in parsed) {
      logger.debug("quests:cmd", "handler-error", { error: parsed.error });
      ctx.ui.notify(parsed.error, "error");
      return;
    }

    switch (parsed.action) {
      case "version": {
        logger.debug("quests:cmd", "version", { version: VERSION });
        ctx.ui.notify(`pi-quests v${VERSION}`, "info");
        return;
      }
      case "changelog": {
        logger.debug("quests:cmd", "changelog", { changelogPath: CHANGELOG_PATH });

        try {
          const content = readFileSync(CHANGELOG_PATH, "utf-8");
          logger.debug("quests:cmd", "changelog-read", { contentLength: content.length });
          const reversedContent = reverseChangelog(content);
          logger.debug("quests:cmd", "changelog-reversed");

          pi.sendMessage({
            customType: "quest-changelog",
            content: "",
            display: true,
            details: { content: reversedContent },
          });

          logger.debug("quests:cmd", "changelog-sent");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.debug("quests:cmd", "changelog-error", { error: errorMessage });
          ctx.ui.notify(`Failed to read changelog: ${errorMessage}`, "error");
        }
        return;
      }
      case "add": {
        const q = questLog.add(parsed.description);
        logger.debug("quests:cmd", "add", { id: q.id });
        ctx.ui.notify(`Added quest #${q.id}`, "info");
        return;
      }
      case "list": {
        if (!ctx.hasUI) {
          logger.debug("quests:cmd", "list-no-ui");
          ctx.ui.notify("Interactive mode required", "error");
          return;
        }
        logger.debug("quests:cmd", "list-open-widget", { count: questLog.getAll().length });
        await ctx.ui.custom(
          (_, theme, __, done) =>
            new QuestListWidget(questLog.getAll(), theme, () => done(undefined)),
        );
        logger.debug("quests:cmd", "list-widget-closed");
        return;
      }
      case "toggle": {
        const q = questLog.toggle(parsed.id);
        if (!q) {
          logger.debug("quests:cmd", "toggle-not-found", { id: parsed.id });
          ctx.ui.notify(formatNotFound(parsed.id), "error");
          return;
        }
        logger.debug("quests:cmd", "toggle", { id: parsed.id, state: q.done });
        ctx.ui.notify(formatToggleResult(parsed.id, q.done), "info");
        return;
      }
      case "update": {
        const q = questLog.update(parsed.id, parsed.description);
        if (!q) {
          logger.debug("quests:cmd", "update-not-found", { id: parsed.id });
          ctx.ui.notify(formatNotFound(parsed.id), "error");
          return;
        }
        logger.debug("quests:cmd", "update", { id: parsed.id });
        ctx.ui.notify(formatUpdateResult(q), "info");
        return;
      }
      case "delete": {
        const q = questLog.delete(parsed.id);
        if (!q) {
          logger.debug("quests:cmd", "delete-not-found", { id: parsed.id });
          ctx.ui.notify(formatNotFound(parsed.id), "error");
          return;
        }
        logger.debug("quests:cmd", "delete", { id: parsed.id });
        ctx.ui.notify(formatDeleteResult(q), "info");
        return;
      }
      case "clear": {
        const count = questLog.clear();
        logger.debug("quests:cmd", "clear", { count });
        ctx.ui.notify(formatClearResult(count), "info");
        return;
      }
      case "revert": {
        const result = questLog.revert();
        logger.debug("quests:cmd", "revert", { success: result.success });
        ctx.ui.notify(result.message, result.success ? "info" : "error");
        return;
      }
      case "help": {
        logger.debug("quests:cmd", "help");
        const lines = ["Available /quests subcommands:"];
        lines.push("  add <description>  - Add a new quest");
        lines.push("  list               - List all quests");
        lines.push("  toggle <id>        - Toggle quest completion");
        lines.push("  delete <id>        - Delete a quest");
        lines.push("  update <id> <desc> - Update a quest description");
        lines.push("  revert             - Revert the last quest change");
        lines.push("  clear              - Clear all quests");
        lines.push("  version            - Show version");
        lines.push("  changelog          - Show changelog");
        lines.push("  h, help            - Show this help message");
        ctx.ui.notify(lines.join("\n"), "info");
        logger.debug("quests:cmd", "help-complete");
        return;
      }
    }
  };
}
