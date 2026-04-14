import type { UserMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { KeyId } from "@mariozechner/pi-tui";
import { createQuestsHandler, openQuestList } from "./commands/handler.js";
import { DEFAULT_CONFIG, getConfig, type ResolvedConfig } from "./config.js";
import { logger } from "./logger.js";
import { QUEST_PROMPT_GATE, QUEST_PROMPT_REMINDER } from "./prompts.js";
import { QuestLog } from "./quest/dataplane.js";
import { formatQuestList } from "./quest/formatters.js";
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
  let questLog = new QuestLog();
  let tracker = new QuestUsageTracker(DEFAULT_CONFIG);
  let config: ResolvedConfig = DEFAULT_CONFIG;

  const shortcutKey = getConfig({ cwd: process.cwd() }).shortcuts?.openQuests ?? "ctrl+shift+l";
  logger.debug("quests:shortcut", "register", { key: shortcutKey });
  pi.registerShortcut(shortcutKey as KeyId, {
    description: "Open quest list",
    handler: async (ctx) => {
      logger.debug("quests:shortcut", "handler", { hasUI: ctx.hasUI });
      if (!ctx.hasUI) {
        logger.debug("quests:shortcut", "no-ui");
        ctx.ui.notify("Interactive mode required", "error");
        return;
      }
      logger.debug("quests:shortcut", "open", { questCount: questLog.getAll().length });
      await openQuestList(pi, questLog, config, ctx);
      logger.debug("quests:shortcut", "closed");
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    config = getConfig(ctx);
    questLog = new QuestLog(config);
    tracker = new QuestUsageTracker(config);
    questLog.reconstructFromSession(ctx);

    registerQuestTool(pi, questLog, config);

    const questsHandler = createQuestsHandler(pi, questLog, config);
    pi.registerCommand("quests", {
      description: "Quest commands: /quests [help] to see usage",
      handler: questsHandler,
    });
  });

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

    const allQuests = questLog.getAll();
    const activeQuests = allQuests.filter((q) => !q.done);
    const activeQuestCount = activeQuests.length;
    const activeTopLevel = activeQuests.filter((q) => !(q as { parentId?: string }).parentId);
    const hasTopLevelQuestWithoutSubs = activeTopLevel.some(
      (q) => !allQuests.some((step) => (step as { parentId?: string }).parentId === q.id),
    );
    const nudge = tracker.getNudge(activeQuestCount, latestPrompt, hasTopLevelQuestWithoutSubs);

    const fakeDoneRegex = new RegExp(config.validation.fakeDonePattern, "i");
    const fakeDone = questLog.getAll().find((q) => !q.done && fakeDoneRegex.test(q.description));
    if (!nudge && !fakeDone) return undefined;

    let content = nudge ?? "";
    if (fakeDone) {
      content += `\nQUEST REMINDER: Quest [${fakeDone.id}] has a completion marker appended to its description but is not toggled done. Use the toggle action to mark it done. NEVER append completion markers to descriptions via the update action.`;
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
    let reminder = "";
    if (quests.length > 0) {
      const remaining = quests.filter((q) => !q.done).length;
      const list = formatQuestList(quests);
      reminder = `Active quests (${remaining}/${quests.length}):\n${list}\n\nKeep quest progress updated as you work.`;
    } else {
      reminder = `${QUEST_PROMPT_REMINDER.join("\n")}\n\nBefore adding any independent quests, clear any previously completed quests from the log to keep it focused on current work.`;
    }

    return {
      systemPrompt: `# Quest Management\n${QUEST_PROMPT_GATE}${event.systemPrompt}\n\n## Quest Management\n${reminder}`,
    };
  });

  // Register custom message renderers
  pi.registerMessageRenderer("quest-changelog", questChangelogRenderer);
}
