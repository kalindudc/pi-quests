import type { ResolvedConfig } from "../config.js";
import { logger } from "../logger.js";
import type { Quest } from "./types.js";

const ACKNOWLEDGEMENT = "Update your quest status before continuing.";

function formatActiveQuests(allQuests: Quest[], limit = 3): string {
  const active = allQuests.filter((q) => !q.done);
  if (active.length === 0) return "";

  const shown = active.slice(0, limit);
  const lines = shown.map((q) => `  [${q.id}]: ${q.description}`);
  if (active.length > limit) lines.push(`  ... and ${active.length - limit} more`);

  return `\nActive quests:\n${lines.join("\n")}`;
}

type NudgeCandidate = { index: number; message: string };

export class QuestUsageTracker {
  private totalToolCalls = 0;
  private consecutiveNonQuestToolCalls = 0;
  private hasEverUsedQuestTool = false;
  private lastQuestToolTime = 0;
  private nudgedThisTurn = false;
  private lastNudgeTime = 0;
  private lastNudgeIndex = -1;

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
    allQuests: Quest[],
    latestPrompt?: string,
    hasTopLevelQuestWithoutSubs?: boolean,
  ): string | undefined {
    if (this.nudgedThisTurn) {
      logger.debug("quests:tracker", "nudge-suppressed", { reason: "turn-limit" });
      return undefined;
    }

    const now = Date.now();
    const cooldownMs = this.config.nudges.hintIntervalMinutes * 60 * 1000;
    if (this.lastNudgeTime > 0 && now - this.lastNudgeTime < cooldownMs) {
      logger.debug("quests:tracker", "nudge-suppressed", {
        reason: "cooldown",
        elapsed: now - this.lastNudgeTime,
        cooldownMs,
      });
      return undefined;
    }

    const eligible = this.getEligibleNudges(
      activeQuestCount,
      allQuests,
      latestPrompt,
      hasTopLevelQuestWithoutSubs,
    );

    logger.debug("quests:tracker", "nudge-candidates", {
      eligible: eligible.length,
      indices: eligible.map((c) => c.index),
    });

    // Rotate priority: start checking from the nudge after the last one that fired
    const rotated = [
      ...eligible.filter((n) => n.index > this.lastNudgeIndex),
      ...eligible.filter((n) => n.index <= this.lastNudgeIndex),
    ];

    const winner = rotated[0];
    if (winner) {
      this.nudgedThisTurn = true;
      this.lastNudgeTime = now;

      logger.debug("quests:tracker", "nudge-fired", {
        winner: winner.index,
        rotatedFrom: this.lastNudgeIndex,
      });
      this.lastNudgeIndex = winner.index;
      return winner.message;
    }

    return undefined;
  }

  private getEligibleNudges(
    activeQuestCount: number,
    allQuests: Quest[],
    latestPrompt?: string,
    hasTopLevelQuestWithoutSubs?: boolean,
  ): NudgeCandidate[] {
    const candidates: NudgeCandidate[] = [];

    // 0. Initialization nudge
    if (this.totalToolCalls >= this.config.nudges.toolCallThreshold && !this.hasEverUsedQuestTool) {
      candidates.push({
        index: 0,
        message: `QUEST REMINDER: You have made ${this.totalToolCalls} tool calls but have NEVER used the quest tool this session. USE the quest tool to initialize tracking and break your work into concrete steps. ${ACKNOWLEDGEMENT}`,
      });
    }

    // 1. Complex-task entrypoint nudge
    if (activeQuestCount === 0 && latestPrompt && this.isComplexPrompt(latestPrompt)) {
      candidates.push({
        index: 1,
        message: `QUEST REMINDER: Your latest prompt is a complex task, but there are 0 active quests. USE the quest tool to break this into concrete, trackable steps. ${ACKNOWLEDGEMENT}`,
      });
    }

    // 2. Time-based alignment nudge
    if (
      this.hasEverUsedQuestTool &&
      this.lastQuestToolTime > 0 &&
      this.consecutiveNonQuestToolCalls >= this.config.nudges.timeBasedToolCallThreshold &&
      Date.now() - this.lastQuestToolTime >= this.config.nudges.hintIntervalMinutes * 60 * 1000
    ) {
      const questContext = formatActiveQuests(allQuests);
      candidates.push({
        index: 2,
        message: `QUEST REMINDER: It has been a while since your last quest tool use and ${this.consecutiveNonQuestToolCalls} tools have been called since then. ALIGN on quest status before continuing.${questContext} ${ACKNOWLEDGEMENT}`,
      });
    }

    // 3. Zero-active sustained-work nudge
    if (
      this.consecutiveNonQuestToolCalls >= this.config.nudges.zeroActiveToolCallThreshold &&
      activeQuestCount === 0
    ) {
      candidates.push({
        index: 3,
        message: `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool and there are 0 active quests. TRACK your work with specific, actionable quests. ${ACKNOWLEDGEMENT}`,
      });
    }

    // 4. Sub-quest suggestion nudge
    if (
      this.hasEverUsedQuestTool &&
      this.consecutiveNonQuestToolCalls >= this.config.nudges.stepSuggestionToolCallThreshold &&
      activeQuestCount > 0 &&
      hasTopLevelQuestWithoutSubs
    ) {
      candidates.push({
        index: 4,
        message: `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool and have active top-level quests without steps. Consider the quest complexity and use the \`split\` action to break them into smaller steps and track progress. ${ACKNOWLEDGEMENT}`,
      });
    }

    // 5. Stale-progress sustained-work nudge (with time-gate)
    if (
      this.consecutiveNonQuestToolCalls >= this.config.nudges.staleProgressToolCallThreshold &&
      activeQuestCount > 0 &&
      this.lastQuestToolTime > 0 &&
      Date.now() - this.lastQuestToolTime >= this.config.nudges.hintIntervalMinutes * 60 * 1000
    ) {
      const questContext = formatActiveQuests(allQuests);
      candidates.push({
        index: 5,
        message: `QUEST REMINDER: You have made ${this.consecutiveNonQuestToolCalls} consecutive tool calls without using the quest tool despite having active quests. UPDATE your quest progress to reflect current status.${questContext} ${ACKNOWLEDGEMENT}`,
      });
    }

    return candidates;
  }

  private isComplexPrompt(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return this.config.nudges.complexTaskKeywords.some((kw) => lower.includes(kw));
  }
}
