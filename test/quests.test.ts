import { describe, expect, it, vi } from "vitest";
import { QuestLog } from "../src/quests.js";

describe("QuestLog", () => {
  it("adds a quest and increments id", () => {
    const log = new QuestLog();
    const q = log.add("Test quest");
    expect(q.description).toBe("Test quest");
    expect(q.done).toBe(false);
    expect(log.getAll()).toHaveLength(1);
  });

  it("toggles quest state", () => {
    const log = new QuestLog();
    const q = log.add("Test");
    const toggled = log.toggle(q.id);
    expect(toggled?.done).toBe(true);
    expect(log.toggle(q.id)?.done).toBe(false);
  });

  it("returns undefined when toggling nonexistent quest", () => {
    const log = new QuestLog();
    expect(log.toggle(999)).toBeUndefined();
  });

  it("clears all quests and returns count", () => {
    const log = new QuestLog();
    log.add("A");
    log.add("B");
    expect(log.clear()).toBe(2);
    expect(log.getAll()).toHaveLength(0);
  });

  it("reverts add", () => {
    const log = new QuestLog();
    log.add("A");
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll()).toHaveLength(0);
  });

  it("reverts toggle", () => {
    const log = new QuestLog();
    const q = log.add("A");
    log.toggle(q.id);
    expect(q.done).toBe(true);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(q.done).toBe(false);
  });

  it("reverts clear", () => {
    const log = new QuestLog();
    log.add("A");
    log.add("B");
    log.clear();
    expect(log.getAll()).toHaveLength(0);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll()).toHaveLength(2);
  });

  it("updates a quest description", () => {
    const log = new QuestLog();
    const q = log.add("Old desc");
    const updated = log.update(q.id, "New desc");
    expect(updated?.description).toBe("New desc");
    expect(log.getAll()[0]?.description).toBe("New desc");
  });

  it("returns undefined when updating nonexistent quest", () => {
    const log = new QuestLog();
    expect(log.update(999, "X")).toBeUndefined();
  });

  it("deletes a quest", () => {
    const log = new QuestLog();
    log.add("A");
    log.add("B");
    const deleted = log.delete(1);
    expect(deleted?.description).toBe("A");
    expect(log.getAll()).toHaveLength(1);
  });

  it("returns undefined when deleting nonexistent quest", () => {
    const log = new QuestLog();
    expect(log.delete(999)).toBeUndefined();
  });

  it("reverts delete", () => {
    const log = new QuestLog();
    log.add("A");
    log.add("B");
    log.delete(1);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll()).toHaveLength(2);
  });

  it("reverts update", () => {
    const log = new QuestLog();
    const q = log.add("Original");
    log.update(q.id, "Changed");
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll()[0]?.description).toBe("Original");
  });

  it("returns nothing to revert when history is empty", () => {
    const log = new QuestLog();
    const result = log.revert();
    expect(result.success).toBe(false);
    expect(result.message).toBe("Nothing to revert");
  });

  it("reconstructs state from session branch", () => {
    const log = new QuestLog();
    const entries = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "quest",
          details: { quests: [{ id: 1, description: "X", done: true, createdAt: 1 }], nextId: 2 },
        },
      },
    ];
    const ctx = {
      sessionManager: { getBranch: vi.fn().mockReturnValue(entries) },
    } as unknown as import("@mariozechner/pi-coding-agent").ExtensionContext;
    log.reconstructFromSession(ctx);
    expect(log.getAll()).toEqual([{ id: 1, description: "X", done: true, createdAt: 1 }]);
  });
});
