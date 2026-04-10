import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createQuestsHandler } from "./commands/quests.js";
import { QuestLog } from "./quests.js";
import { questChangelogRenderer } from "./renderers/changelog.js";
import { registerQuestTool } from "./tools/quest.js";

/**
 * pi-quests
 *
 * A quest-log extension for pi-coding-agent.
 *
 * Roadmap:
 * - Register tools for agents to add, list, and manage quest items.
 * - Snapshot relevant session state at each quest milestone.
 * - Provide rollback support to restore a previous snapshot.
 */
export default function (pi: ExtensionAPI): void {
  const questLog = new QuestLog();

  pi.on("session_start", async (_event, ctx) => questLog.reconstructFromSession(ctx));
  pi.on("session_tree", async (_event, ctx) => questLog.reconstructFromSession(ctx));

  registerQuestTool(pi, questLog);

  // Register custom message renderers
  pi.registerMessageRenderer("quest-changelog", questChangelogRenderer);

  // Register the top-level /quests command dispatcher.
  pi.registerCommand("quests", {
    description: "Quest commands: /quests [help] to see usage",
    handler: createQuestsHandler(pi, questLog),
  });
}
