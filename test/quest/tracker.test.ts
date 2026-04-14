import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config.js";
import { QuestUsageTracker } from "../../src/quest/tracker.js";

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

  it("returns time-based nudge after 5 minutes and 5 tools since last quest use", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    for (let i = 0; i < 5; i++) tracker.onToolExecution("read");
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

  it("returns stale-progress nudge after 16 consecutive non-quest tools with active quests", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 15; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(2)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(2);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("active quests");
    expect(nudge).toContain("Update your quest status before continuing");
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
    // Immediately eligible again, but blocked by 5-minute global cooldown
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
    // Init: totalToolCalls >= 8, never used quest tool
    for (let i = 0; i < 8; i++) tracker.onToolExecution("read");
    // Zero-active: consecutiveNonQuestToolCalls >= 8, activeQuestCount === 0
    // After 8 reads, both init and zero-active are eligible
    const second = tracker.getNudge(0);
    // Rotation should pick index 3 (zero-active) before index 0 (init)
    // because lastNudgeIndex was 1, so index 3 > 1 comes before index 0 <= 1
    expect(second).toContain("0 active quests");
    vi.useRealTimers();
  });
});
