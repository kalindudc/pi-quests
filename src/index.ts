import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createQuestsHandler } from "./commands/quests.js";
import { questChangelogRenderer } from "./renderers/quest-changelog.js";

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
  // Register custom message renderers
  pi.registerMessageRenderer("quest-changelog", questChangelogRenderer);

  // Register the top-level /quests command dispatcher.
  // Subcommands: version, changelog (more to come: add, list, done, rollback, clear)
  pi.registerCommand("quests", {
    description: "Quest commands: /quests version, /quests changelog",
    handler: createQuestsHandler(pi),
  });
}
