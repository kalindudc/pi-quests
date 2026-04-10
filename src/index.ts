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

  pi.on("before_agent_start", async (event) => {
    const quests = questLog.getAll();
    const gate =
      "# Quest Management\nBefore reading files, running commands, or making edits, ALWAYS ensure the current work is tracked as specific, actionable quests. ALWAYS break broad requests into concrete steps.\n\n";

    let reminder =
      "## Quest Management\nUse the quest tool VERY frequently to track tasks, plans, and progress throughout the conversation. It is critical that you toggle quests to done as soon as you complete them. NEVER batch up multiple tasks before marking them completed.\n\nNEVER create a single vague quest for broad requests. Analyze the user's intent and break it into specific, independent, actionable quests that each represent a concrete step.";
    if (quests.length > 0) {
      const remaining = quests.filter((q) => !q.done).length;
      const list = quests
        .map((q) => `#${q.id} [${q.done ? "x" : " "}] ${q.description}`)
        .join("\n");
      reminder += `\n\nActive quests (${remaining}/${quests.length}):\n${list}`;
    }
    return { systemPrompt: `${gate}${event.systemPrompt}\n\n${reminder}` };
  });

  registerQuestTool(pi, questLog);

  // Register custom message renderers
  pi.registerMessageRenderer("quest-changelog", questChangelogRenderer);

  // Register the top-level /quests command dispatcher.
  pi.registerCommand("quests", {
    description: "Quest commands: /quests [help] to see usage",
    handler: createQuestsHandler(pi, questLog),
  });
}
