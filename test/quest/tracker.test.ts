import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config.js";
import { QuestUsageTracker } from "../../src/quest/tracker.js";

describe("QuestUsageTracker", () => {
  it("returns init nudge after 3 non-quest tools when never used", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("read");
    tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain(" NEVER ");
    expect(nudge).toContain("acknowledge this reminder");
  });

  it("returns complex-task nudge when prompt matches and 0 active quests", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    const nudge = tracker.getNudge(0, "Refactor the auth module");
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("complex task");
    expect(nudge).toContain("acknowledge this reminder");
  });

  it("returns time-based nudge after 8 minutes and 3 tools since last quest use", () => {
    vi.useFakeTimers();
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    vi.advanceTimersByTime(1);
    tracker.onToolExecution("read");
    tracker.onToolExecution("read");
    tracker.onToolExecution("read");
    expect(tracker.getNudge(1)).toBeUndefined();
    vi.advanceTimersByTime(8 * 60 * 1000);
    const nudge = tracker.getNudge(1);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("been a while since your last quest tool use");
    expect(nudge).toContain("acknowledge this reminder");
    vi.useRealTimers();
  });

  it("returns zero-active nudge after 5 consecutive non-quest tools with 0 active", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 4; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("0 active quests");
    expect(nudge).toContain("acknowledge this reminder");
  });

  it("returns stale-progress nudge after 10 consecutive non-quest tools with active quests", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 9; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(2)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(2);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("active quests");
    expect(nudge).toContain("acknowledge this reminder");
  });

  it("resets consecutive counter on quest tool use", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    for (let i = 0; i < 2; i++) tracker.onToolExecution("read");
    tracker.onToolExecution("quest");
    for (let i = 0; i < 4; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(0);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("0 active quests");
  });

  it("returns undefined when already nudged this turn", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    for (let i = 0; i < 5; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(0)).toBeDefined();
    expect(tracker.getNudge(0)).toBeUndefined();
  });

  it("does not nudge for complex prompt when active quests exist", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    expect(tracker.getNudge(3, "Refactor the auth module")).toBeUndefined();
  });

  it("returns sub-quest suggestion nudge when active top-level quests lack sub-quests", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 5; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1, undefined, true)).toBeUndefined();
    tracker.onToolExecution("read");
    const nudge = tracker.getNudge(1, undefined, true);
    expect(nudge).toContain("QUEST REMINDER");
    expect(nudge).toContain("parentId");
    expect(nudge).toContain("acknowledge this reminder");
  });

  it("does not return sub-quest suggestion nudge when all top-level quests have sub-quests", () => {
    const tracker = new QuestUsageTracker(DEFAULT_CONFIG);
    tracker.onToolExecution("quest");
    for (let i = 0; i < 5; i++) tracker.onToolExecution("read");
    expect(tracker.getNudge(1, undefined, false)).toBeUndefined();
  });
});
