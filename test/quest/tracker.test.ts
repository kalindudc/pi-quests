import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config.js";
import { QuestUsageTracker } from "../../src/quest/tracker.js";

vi.mock("../../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

describe("QuestUsageTracker", () => {
  it("returns init nudge after 8 non-quest tools when never used", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    for (let i = 0; i < 7; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain(" NEVER ");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("returns complex-task nudge when prompt matches and 0 active quests", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const nudge = tracker.getNudge(0, "Refactor the auth module");
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("complex task");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("returns time-based nudge after 4 minutes and 8 tools since last quest use", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1)).toBeUndefined();
    vi.advanceTimersByTime(5 * 60 * 1000);
    const nudge = tracker.getNudge(1);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("been a while since your last quest tool use");
    expect(nudge).toContain("Update your quest status before continuing");
    vi.useRealTimers();
  });

  it("returns zero-active nudge after 8 consecutive non-quest tools with 0 active", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 7; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("0 active quests");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("returns stale-progress nudge after 12 consecutive non-quest tools with active quests AND elapsed time", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    for (let i = 0; i < 12; i++) tracker.onToolExecution("read");
    // 12 consecutive but not enough elapsed time — neither time-based nor stale-progress fires
    expect(tracker.getNudge(2)).toBeUndefined();
    vi.advanceTimersByTime(5 * 60 * 1000);
    // Time-based (index 2) fires first due to rotation (both eligible, lower index wins)
    const timeNudge = tracker.getNudge(2);
    expect(timeNudge).toContain("been a while since your last quest tool use");
    // Advance past cooldown, clear turn flag
    vi.advanceTimersByTime(5 * 60 * 1000);
    tracker.clearTurnNudge();
    // Now stale-progress (index 5) fires via rotation (lastNudgeIndex was 2, so 5 > 2)
    const staleNudge = tracker.getNudge(1);
    expect(staleNudge).toContain("QUEST REMINDER");
    expect(staleNudge).toContain("despite having active quests");
    expect(staleNudge).toContain("Update your quest status before continuing");
    vi.useRealTimers();
  });

  it("stale-progress nudge does NOT fire without time-gate even with high call count", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    for (let i = 0; i < 20; i++) tracker.onToolExecution("read");
    // Lots of calls but not enough elapsed time — only 1ms since quest tool use
    const nudge = tracker.getNudge(2);
    // Should not contain stale-progress (index 5) message
    // Could be time-based (index 2) or undefined due to no time gate either
    if (nudge) {
      expect(nudge).not.toContain("despite having active quests");
    }
    vi.useRealTimers();
  });

  it("resets consecutive counter on quest tool use", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    for (let i = 0; i < 2; i++) tracker.onToolExecution("read");
    tracker.onToolExecution("quest");
    for (let i = 0; i < 7; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("0 active quests");
  });

  it("returns undefined when already nudged this turn", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeDefined();
    expect(tracker.getNudge(0)).toBeUndefined();
  });

  it("does not nudge for complex prompt when active quests exist", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    expect(tracker.getNudge(3, "Refactor the auth module")).toBeUndefined();
  });

  it("returns step suggestion nudge when active top-level quests lack steps", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 9; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1, undefined, true)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(1, undefined, true);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("split");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("step suggestion nudge uses suggestive language, not directive", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 10; i++) tracker.onToolExecution("read");
    const nudge = tracker.getNudge(1, undefined, true);
    expect(nudge).toContain("Consider");
    expect(nudge).not.toContain("Use the `split` action");
  });

  it("does not return step suggestion nudge when all top-level quests have steps", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 9; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1, undefined, false)).toBeUndefined();
  });

  it("enforces global cooldown between any nudges", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 7; i++) tracker.onToolExecution("read");
    // Zero-active nudge eligible at 8 consecutive reads
    tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeDefined();
    // Clear turn flag so cooldown is the only blocker
    tracker.clearTurnNudge();
    // Immediately eligible again, but blocked by 4-minute global cooldown
    expect(tracker.getNudge(0)).toBeUndefined();
    vi.advanceTimersByTime(4 * 60 * 1000 - 1);
    expect(tracker.getNudge(0)).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(tracker.getNudge(0)).toBeDefined();
    vi.useRealTimers();
  });

  it("rotates nudge priority after a nudge fires", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    // Fire complex-task nudge (index 1) first
    const first = tracker.getNudge(0, "Refactor the auth module");
    expect(first).toContain("complex task");

    // Advance past global cooldown
    vi.advanceTimersByTime(5 * 60 * 1000);
    tracker.clearTurnNudge();

    // Now make init nudge (index 0) and zero-active nudge (index 3) both eligible
    for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
    const second = tracker.getNudge(0);
    // Rotation should pick index 3 (zero-active) before index 0 (init)
    expect(second).toContain("0 active quests");
    vi.useRealTimers();
  });

  describe("narrowed keyword list", () => {
    it("does NOT trigger complex-task nudge for removed keywords", () => {
      const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
      for (const prompt of [
        "write a comment",
        "fix the typo",
        "create a new file",
        "build the project",
      ]) {
        const nudge = tracker.getNudge(0, prompt);
        // "fix" is still in the keyword list, so "fix the typo" WILL trigger
        // but "write", "create", "build" were removed
        if (prompt.includes("fix")) {
          expect(nudge).toContain("complex task");
        } else {
          expect(nudge).toBeUndefined();
        }
        tracker.clearTurnNudge();
      }
    });

    it("triggers complex-task nudge for retained keywords", () => {
      for (const prompt of [
        "implement the auth module",
        "refactor the parser",
        "investigate the crash",
        "analyze the logs",
        "audit the security",
        "design the API",
      ]) {
        const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
        const nudge = tracker.getNudge(0, prompt);
        expect(nudge).toContain("complex task");
      }
    });
  });

  describe("hasUsedQuestTool / markQuestToolUsed", () => {
    it("hasUsedQuestTool is false for a fresh tracker, true after onToolExecution('quest'), and stays true after non-quest calls", () => {
      const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
      expect(tracker.hasUsedQuestTool).toBe(false);
      tracker.onToolExecution("quest");
      expect(tracker.hasUsedQuestTool).toBe(true);
      for (let i = 0; i < 5; i++) tracker.onToolExecution("read");
      expect(tracker.hasUsedQuestTool).toBe(true);
    });

    it("markQuestToolUsed flips hasUsedQuestTool without bumping totalToolCalls or consecutiveNonQuestToolCalls", () => {
      const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
      tracker.markQuestToolUsed();
      expect(tracker.hasUsedQuestTool).toBe(true);
      // Init nudge (index 0) requires `!hasEverUsedQuestTool`, so it should NOT fire after seeding.
      // But the time-based nudge (index 2) requires hasEverUsedQuestTool + consecutive >= threshold + elapsed time.
      // After 8 consecutive non-quest tool calls, with ZERO time advancement, no nudge fires (time-gate).
      for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
      // Counters were untouched by markQuestToolUsed, so consecutiveNonQuestToolCalls is now exactly 8.
      // Without time advancement, time-based nudge time-gate blocks, and zero-active fires for activeCount=0.
      const nudge = tracker.getNudge(0);
      // zero-active should fire because consecutive >= 8 and active==0 (counter wasn't reset by seed)
      expect(nudge).toContain("0 active quests");
      // Init nudge MUST NOT have fired because hasEverUsedQuestTool is true after seed.
      expect(nudge).not.toContain("NEVER used the quest tool");
    });
  });
});
