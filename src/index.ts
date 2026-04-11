import type { UserMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createQuestsHandler } from "./commands/handler.js";
import { QUEST_PROMPT_GATE, QUEST_PROMPT_REMINDER } from "./prompts.js";
import { QuestLog } from "./quest/dataplane.js";
import { QuestUsageTracker } from "./quest/tracker.js";
import { questChangelogRenderer } from "./renderers/changelog.js";
import { registerQuestTool } from "./tools/handler.js";

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
  const tracker = new QuestUsageTracker();

  pi.on("session_start", async (_event, ctx) => questLog.reconstructFromSession(ctx));
  pi.on("session_tree", async (_event, ctx) => questLog.reconstructFromSession(ctx));

  pi.on("turn_start", async () => tracker.clearTurnNudge());

  pi.on("tool_execution_end", async (event) => {
    tracker.onToolExecution(event.toolName);
  });

  pi.on("context", async (event) => {
    const latestPrompt = event.messages
      .filter((m) => m.role === "user")
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .join("\n");

    const activeQuestCount = questLog.getAll().filter((q) => !q.done).length;
    const nudge = tracker.getNudge(activeQuestCount, latestPrompt);

    const fakeDoneRegex =
      /\s[-–—]\s*(DONE|COMPLETED|FINISHED)$|\s[([](DONE|COMPLETED|FINISHED)[)\]]$/i;
    const fakeDone = questLog.getAll().find((q) => !q.done && fakeDoneRegex.test(q.description));
    if (!nudge && !fakeDone) return undefined;

    let content = nudge ?? "";
    if (fakeDone) {
      content += `\nQUEST REMINDER: Quest #${fakeDone.id} has a completion marker appended to its description but is not toggled done. Use the toggle action to mark it done. NEVER append completion markers to descriptions via the update action.`;
    }

    const reminder: UserMessage = {
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };
    return { messages: [...event.messages, reminder] };
  });

  pi.on("before_agent_start", async (event) => {
    const quests = questLog.getAll();
    let reminder = QUEST_PROMPT_REMINDER.join("\n");
    if (quests.length > 0) {
      const remaining = quests.filter((q) => !q.done).length;
      const list = quests
        .map((q) => `#${q.id} [${q.done ? "x" : " "}] ${q.description}`)
        .join("\n");

      reminder += `\n\nActive quests (${remaining}/${quests.length}):\n${list}`;
    }

    return {
      systemPrompt: `# Quest Management\n${QUEST_PROMPT_GATE}${event.systemPrompt}\n\n## Quest Management\n${reminder}`,
    };
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
