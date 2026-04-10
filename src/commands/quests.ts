import { readFileSync } from "node:fs";
import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { logger } from "../logger.js";
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

export function createQuestsHandler(pi: ExtensionAPI) {
  return async function handler(args: string, ctx: ExtensionCommandContext): Promise<void> {
    const subcommand = args.trim().split(/\s+/)[0];

    switch (subcommand) {
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
      default: {
        ctx.ui.notify("Usage: /quests [version | changelog]", "error");
        return;
      }
    }
  };
}
