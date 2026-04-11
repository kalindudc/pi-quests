export const COMPLEX_TASK_KEYWORDS = [
  "implement",
  "refactor",
  "investigate",
  "review",
  "analyze",
  "audit",
  "plan",
  "design",
  "create",
  "build",
  "write",
  "fix",
] as const;

const ACKNOWLEDGEMENT =
  "ALWAYS acknowledge this reminder and create, update, or align on quests before making further tool calls.";

export class QuestUsageTracker {
  private totalToolCalls = 0;
  private consecutiveNonQuestToolCalls = 0;
  private hasEverUsedQuestTool = false;
  private lastQuestToolTime = 0;
  private nudgedThisTurn = false;

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

  getNudge(activeQuestCount: number, latestPrompt?: string): string | undefined {
    if (this.nudgedThisTurn) return undefined;

    // 1. Initialization nudge
    if (this.totalToolCalls >= 3 && !this.hasEverUsedQuestTool) {
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
      this.consecutiveNonQuestToolCalls >= 3 &&
      // 8 minutes without quest tool use
      Date.now() - this.lastQuestToolTime >= 8 * 60 * 1000
    ) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: It has been a while since your last quest tool use and ${this.consecutiveNonQuestToolCalls} tools have been called since then. ALIGN on quest status before continuing. ${ACKNOWLEDGEMENT}`;
    }

    // 4. Zero-active sustained-work nudge
    if (this.consecutiveNonQuestToolCalls >= 5 && activeQuestCount === 0) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool and there are 0 active quests. TRACK your work with specific, actionable quests. ${ACKNOWLEDGEMENT}`;
    }

    // 5. Stale-progress sustained-work nudge
    if (this.consecutiveNonQuestToolCalls >= 10 && activeQuestCount > 0) {
      this.nudgedThisTurn = true;
      return `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool despite having active quests. UPDATE your quest progress to reflect current status. ${ACKNOWLEDGEMENT}`;
    }

    return undefined;
  }

  private isComplexPrompt(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return COMPLEX_TASK_KEYWORDS.some((kw) => lower.includes(kw));
  }
}
