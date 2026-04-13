import type { ResolvedConfig } from "../config.js";

const ACKNOWLEDGEMENT =
  "ALWAYS acknowledge this reminder immediately and create, update, or align on quests before making further tool calls. DO NOT add this acknowledgement as another quest.";

export class QuestUsageTracker {
  private totalToolCalls = 0;
  private consecutiveNonQuestToolCalls = 0;
  private hasEverUsedQuestTool = false;
  private lastQuestToolTime = 0;
  private nudgedThisTurn = false;

  constructor(private readonly config: ResolvedConfig) {}

  onToolExecution(toolName: string): void {
    this.totalToolCalls++;
    if (toolName === "quest") {
      this.hasEverUsedQuestTool = true;
      this.lastQuestToolTime = Date.now();
      this.consecutiveNonQuestToolCalls = 0;
    } else {
      this.consecutiveNonQuestToolCalls++;
    }
  }

  clearTurnNudge(): void {
    this.nudgedThisTurn = false;
  }

  getNudge(
    activeQuestCount: number,
    latestPrompt?: string,
    hasTopLevelQuestWithoutSubs?: boolean,
  ): string | undefined {
    if (this.nudgedThisTurn) return undefined;

    // 1. Initialization nudge
    if (this.totalToolCalls >= this.config.nudges.toolCallThreshold && !this.hasEverUsedQuestTool) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: You have made ${this.totalToolCalls} tool calls but have NEVER used the quest tool this session. USE the quest tool to initialize tracking and break your work into concrete steps. ${ACKNOWLEDGEMENT}`;
    }

    // 2. Complex-task entrypoint nudge
    if (activeQuestCount === 0 && latestPrompt && this.isComplexPrompt(latestPrompt)) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: Your latest prompt appears to be a complex task, but there are 0 active quests. USE the quest tool to break this into concrete, trackable steps. ${ACKNOWLEDGEMENT}`;
    }

    // 3. Time-based alignment nudge
    if (
      this.hasEverUsedQuestTool &&
      this.lastQuestToolTime > 0 &&
      this.consecutiveNonQuestToolCalls >= this.config.nudges.timeBasedToolCallThreshold &&
      Date.now() - this.lastQuestToolTime >= this.config.nudges.hintIntervalMinutes * 60 * 1000
    ) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: It has been a while since your last quest tool use and ${this.consecutiveNonQuestToolCalls} tools have been called since then. ALIGN on quest status before continuing. ${ACKNOWLEDGEMENT}`;
    }

    // 4. Zero-active sustained-work nudge
    if (
      this.consecutiveNonQuestToolCalls >= this.config.nudges.zeroActiveToolCallThreshold &&
      activeQuestCount === 0
    ) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool and there are 0 active quests. TRACK your work with specific, actionable quests. ${ACKNOWLEDGEMENT}`;
    }

    // 5. Sub-quest suggestion nudge
    if (
      this.hasEverUsedQuestTool &&
      this.consecutiveNonQuestToolCalls >= this.config.nudges.subQuestSuggestionToolCallThreshold &&
      activeQuestCount > 0 &&
      hasTopLevelQuestWithoutSubs
    ) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool and have active top-level quests without sub-quests. Use the \`add\` action with \`parentId\` to break down complex tasks into smaller, trackable steps. ${ACKNOWLEDGEMENT}`;
    }

    // 6. Stale-progress sustained-work nudge
    if (
      this.consecutiveNonQuestToolCalls >= this.config.nudges.staleProgressToolCallThreshold &&
      activeQuestCount > 0
    ) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool despite having active quests.\nUPDATE your quest progress to reflect current status.\nALWAYS use sub quests to break down a quest into smaller steps, and to group related tasks together. ${ACKNOWLEDGEMENT}`;
    }

    return undefined;
  }

  private isComplexPrompt(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return this.config.nudges.complexTaskKeywords.some((kw) => lower.includes(kw));
  }
}
