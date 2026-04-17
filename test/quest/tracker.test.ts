import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config.js";
import { QuestUsageTracker } from "../../src/quest/tracker.js";
import type { Quest } from "../../src/quest/types.js";

vi.mock("../../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

function makeQuests(...items: Array<{ id: string; description: string; done?: boolean }>): Quest[] {
  return items.map((q) => ({
    id: q.id,
    description: q.description,
    done: q.done ?? false,
    createdAt: Date.now(),
  }));
}

const NO_QUESTS: Quest[] = [];

describe("QuestUsageTracker", () => {
  it("returns init nudge after 8 non-quest tools when never used", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    for (let i = 0; i < 7; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0, NO_QUESTS)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0, NO_QUESTS);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain(" NEVER ");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("returns complex-task nudge when prompt matches and 0 active quests", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const nudge = tracker.getNudge(0, NO_QUESTS, "Refactor the auth module");
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("complex task");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("returns time-based nudge after 4 minutes and 8 tools since last quest use", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const quests = makeQuests({ id: "01", description: "Task A" });
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1, quests)).toBeUndefined();
    vi.advanceTimersByTime(5 * 60 * 1000);
    const nudge = tracker.getNudge(1, quests);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("been a while since your last quest tool use");
    expect(nudge).toContain("Update your quest status before continuing");
    vi.useRealTimers();
  });

  it("returns zero-active nudge after 8 consecutive non-quest tools with 0 active", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 7; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0, NO_QUESTS)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0, NO_QUESTS);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("0 active quests");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("returns stale-progress nudge after 12 consecutive non-quest tools with active quests AND elapsed time", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const quests = makeQuests({ id: "01", description: "Task A" });
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    for (let i = 0; i < 12; i++) tracker.onToolExecution("read");
    // 12 consecutive but not enough elapsed time — neither time-based nor stale-progress fires
    expect(tracker.getNudge(2, quests)).toBeUndefined();
    vi.advanceTimersByTime(5 * 60 * 1000);
    // Time-based (index 2) fires first due to rotation (both eligible, lower index wins)
    const timeNudge = tracker.getNudge(2, quests);
    expect(timeNudge).toContain("been a while since your last quest tool use");
    // Advance past cooldown, clear turn flag
    vi.advanceTimersByTime(5 * 60 * 1000);
    tracker.clearTurnNudge();
    // Now stale-progress (index 5) fires via rotation (lastNudgeIndex was 2, so 5 > 2)
    const staleNudge = tracker.getNudge(1, quests);
    expect(staleNudge).toContain("QUEST REMINDER");
    expect(staleNudge).toContain("despite having active quests");
    expect(staleNudge).toContain("Update your quest status before continuing");
    vi.useRealTimers();
  });

  it("stale-progress nudge does NOT fire without time-gate even with high call count", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const quests = makeQuests({ id: "01", description: "Task A" });
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    for (let i = 0; i < 20; i++) tracker.onToolExecution("read");
    // Lots of calls but not enough elapsed time — only 1ms since quest tool use
    const nudge = tracker.getNudge(2, quests);
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
    expect(tracker.getNudge(0, NO_QUESTS)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0, NO_QUESTS);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("0 active quests");
  });

  it("returns undefined when already nudged this turn", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0, NO_QUESTS)).toBeDefined();
    expect(tracker.getNudge(0, NO_QUESTS)).toBeUndefined();
  });

  it("does not nudge for complex prompt when active quests exist", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const quests = makeQuests({ id: "01", description: "Existing" });
    expect(tracker.getNudge(3, quests, "Refactor the auth module")).toBeUndefined();
  });

  it("returns step suggestion nudge when active top-level quests lack steps", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const quests = makeQuests({ id: "01", description: "Big task" });
    tracker.onToolExecution("quest");
    for (let i = 0; i < 9; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1, quests, undefined, true)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(1, quests, undefined, true);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("split");
    expect(nudge).toContain("Update your quest status before continuing");
  });

  it("step suggestion nudge uses suggestive language, not directive", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const quests = makeQuests({ id: "01", description: "Big task" });
    tracker.onToolExecution("quest");
    for (let i = 0; i < 10; i++) tracker.onToolExecution("read");
    const nudge = tracker.getNudge(1, quests, undefined, true);
    expect(nudge).toContain("Consider");
    expect(nudge).not.toContain("Use the `split` action");
  });

  it("does not return step suggestion nudge when all top-level quests have steps", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const quests = makeQuests({ id: "01", description: "Big task" });
    tracker.onToolExecution("quest");
    for (let i = 0; i < 9; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1, quests, undefined, false)).toBeUndefined();
  });

  it("enforces global cooldown between any nudges", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 7; i++) tracker.onToolExecution("read");
    // Zero-active nudge eligible at 8 consecutive reads
    tracker.onToolExecution("read");
    expect(tracker.getNudge(0, NO_QUESTS)).toBeDefined();
    // Clear turn flag so cooldown is the only blocker
    tracker.clearTurnNudge();
    // Immediately eligible again, but blocked by 4-minute global cooldown
    expect(tracker.getNudge(0, NO_QUESTS)).toBeUndefined();
    vi.advanceTimersByTime(4 * 60 * 1000 - 1);
    expect(tracker.getNudge(0, NO_QUESTS)).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(tracker.getNudge(0, NO_QUESTS)).toBeDefined();
    vi.useRealTimers();
  });

  it("rotates nudge priority after a nudge fires", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    // Fire complex-task nudge (index 1) first
    const first = tracker.getNudge(0, NO_QUESTS, "Refactor the auth module");
    expect(first).toContain("complex task");

    // Advance past global cooldown
    vi.advanceTimersByTime(5 * 60 * 1000);
    tracker.clearTurnNudge();

    // Now make init nudge (index 0) and zero-active nudge (index 3) both eligible
    for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
    const second = tracker.getNudge(0, NO_QUESTS);
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
        const nudge = tracker.getNudge(0, NO_QUESTS, prompt);
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
        const nudge = tracker.getNudge(0, NO_QUESTS, prompt);
        expect(nudge).toContain("complex task");
      }
    });
  });

  describe("context-aware messages", () => {
    it("time-alignment nudge includes active quest IDs when quests exist", () => {
      vi.useFakeTimers();
      const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
      const quests = makeQuests(
        { id: "ab", description: "Fix auth" },
        { id: "cd", description: "Update tests" },
      );
      tracker.onToolExecution("quest");
      vi.advanceTimersByTime(1);
      for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
      vi.advanceTimersByTime(5 * 60 * 1000);
      const nudge = tracker.getNudge(2, quests);
      expect(nudge).toContain("[ab]: Fix auth");
      expect(nudge).toContain("[cd]: Update tests");
      vi.useRealTimers();
    });

    it("stale-progress nudge includes active quest IDs when quests exist", () => {
      vi.useFakeTimers();
      const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
      const quests = makeQuests(
        { id: "ab", description: "Fix auth" },
        { id: "cd", description: "Update tests", done: true },
      );
      tracker.onToolExecution("quest");
      vi.advanceTimersByTime(1);
      for (let i = 0; i < 12; i++) tracker.onToolExecution("read");
      vi.advanceTimersByTime(5 * 60 * 1000);
      const nudge = tracker.getNudge(1, quests);
      expect(nudge).toContain("[ab]: Fix auth");
      // done quest should NOT appear
      expect(nudge).not.toContain("[cd]: Update tests");
      vi.useRealTimers();
    });

    it("limits active quest display to 3", () => {
      vi.useFakeTimers();
      const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
      const quests = makeQuests(
        { id: "01", description: "Quest 1" },
        { id: "02", description: "Quest 2" },
        { id: "03", description: "Quest 3" },
        { id: "04", description: "Quest 4" },
      );
      tracker.onToolExecution("quest");
      vi.advanceTimersByTime(1);
      for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
      vi.advanceTimersByTime(5 * 60 * 1000);
      const nudge = tracker.getNudge(4, quests);
      expect(nudge).toContain("[01]: Quest 1");
      expect(nudge).toContain("[03]: Quest 3");
      expect(nudge).not.toContain("[04]: Quest 4");
      expect(nudge).toContain("and 1 more");
      vi.useRealTimers();
    });
  });
});
