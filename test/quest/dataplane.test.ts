import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestLog } from "../../src/quest/dataplane.js";
import { QUEST_ACTIONS } from "../../src/quest/types.js";

let randomCall = 0;
beforeEach(() => {
  randomCall = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    randomCall++;
    return randomCall / 256;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

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
    expect(log.toggle("ff")).toBeUndefined();
  });

  it("clears all quests and returns count", () => {
    const log = new QuestLog();
    log.add("A");
    log.add("B");
    expect(log.clear(true)).toBe(2);
    expect(log.getAll()).toHaveLength(0);
  });

  it("clear defaults to removing done quests, keeps ids stable, and can revert", () => {
    const log = new QuestLog();
    const a = log.add("A");
    const b = log.add("B");
    log.toggle(a.id);
    expect(log.clear()).toBe(1);
    expect(log.getAll()).toHaveLength(1);
    expect(log.getAll()[0]?.id).toBe(b.id);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll()).toHaveLength(2);
    expect(log.getAll().map((q) => ({ id: q.id, desc: q.description }))).toEqual([
      { id: a.id, desc: "A" },
      { id: b.id, desc: "B" },
    ]);
  });

  it("clear all removes everything and can revert", () => {
    const log = new QuestLog();
    log.add("A");
    log.add("B");
    expect(log.clear(true)).toBe(2);
    expect(log.getAll()).toHaveLength(0);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll()).toHaveLength(2);
  });

  it("reorder changes quest position, keeps ids stable, and can revert", () => {
    const log = new QuestLog();
    const a = log.add("A");
    const b = log.add("B");
    const c = log.add("C");
    const reordered = log.reorder(b.id, a.id);
    expect(reordered?.description).toBe("B");
    expect(reordered?.id).toBe(b.id);
    expect(log.getAll().map((q) => ({ id: q.id, desc: q.description }))).toEqual([
      { id: b.id, desc: "B" },
      { id: a.id, desc: "A" },
      { id: c.id, desc: "C" },
    ]);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll().map((q) => ({ id: q.id, desc: q.description }))).toEqual([
      { id: a.id, desc: "A" },
      { id: b.id, desc: "B" },
      { id: c.id, desc: "C" },
    ]);
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
    log.clear(true);
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
    expect(log.update("ff", "X")).toBeUndefined();
  });

  it("deletes a quest", () => {
    const log = new QuestLog();
    const a = log.add("A");
    log.add("B");
    const deleted = log.delete(a.id);
    expect(deleted?.description).toBe("A");
    expect(log.getAll()).toHaveLength(1);
  });

  it("returns undefined when deleting nonexistent quest", () => {
    const log = new QuestLog();
    expect(log.delete("ff")).toBeUndefined();
  });

  it("reverts delete", () => {
    const log = new QuestLog();
    const a = log.add("A");
    log.add("B");
    log.delete(a.id);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll()).toHaveLength(2);
  });

  it("delete removes the id from usedIds", () => {
    const log = new QuestLog();
    const a = log.add("A");
    log.add("B");
    expect(log.getUsedIds()).toContain(a.id);
    log.delete(a.id);
    expect(log.getUsedIds()).not.toContain(a.id);
  });

  it("revert delete restores the id to usedIds", () => {
    const log = new QuestLog();
    const a = log.add("A");
    log.add("B");
    log.delete(a.id);
    expect(log.getUsedIds()).not.toContain(a.id);
    log.revert();
    expect(log.getUsedIds()).toContain(a.id);
  });

  it("clear(false) removes done quest ids from usedIds", () => {
    const log = new QuestLog();
    const a = log.add("A");
    const b = log.add("B");
    log.toggle(a.id);
    expect(log.getUsedIds()).toContain(a.id);
    expect(log.getUsedIds()).toContain(b.id);
    log.clear();
    expect(log.getUsedIds()).not.toContain(a.id);
    expect(log.getUsedIds()).toContain(b.id);
  });

  it("clear(true) removes all ids from usedIds", () => {
    const log = new QuestLog();
    const a = log.add("A");
    const b = log.add("B");
    expect(log.getUsedIds()).toContain(a.id);
    expect(log.getUsedIds()).toContain(b.id);
    log.clear(true);
    expect(log.getUsedIds()).toHaveLength(0);
  });

  it("revert clear restores usedIds", () => {
    const log = new QuestLog();
    const a = log.add("A");
    const b = log.add("B");
    log.clear(true);
    expect(log.getUsedIds()).toHaveLength(0);
    log.revert();
    expect(log.getUsedIds()).toContain(a.id);
    expect(log.getUsedIds()).toContain(b.id);
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

  it("reverts reorder after clear because quest references are preserved", () => {
    const log = new QuestLog();
    const a = log.add("A");
    const b = log.add("B");
    log.reorder(b.id, a.id);
    expect(log.getAll().map((q) => q.description)).toEqual(["B", "A"]);
    log.clear(true);
    expect(log.getAll()).toHaveLength(0);
    log.revert();
    expect(log.getAll().map((q) => q.description)).toEqual(["B", "A"]);
    const result = log.revert();
    expect(result.success).toBe(true);
    expect(log.getAll().map((q) => q.description)).toEqual(["A", "B"]);
  });

  it("reconstructs state from session branch", () => {
    const log = new QuestLog();
    const entries = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "quest",
          details: { quests: [{ id: "01", description: "X", done: true, createdAt: 1 }] },
        },
      },
    ];
    const ctx = {
      sessionManager: { getBranch: vi.fn().mockReturnValue(entries) },
    } as unknown as ExtensionContext;
    log.reconstructFromSession(ctx);
    expect(log.getAll()).toEqual([{ id: "01", description: "X", done: true, createdAt: 1 }]);
  });
});

describe("QuestLog.execute", () => {
  it("executes add action", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.add, descriptions: ["Test"] });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Added quest [01]: Test");
    expect(log.getAll()).toHaveLength(1);
  });

  it("returns error for add without description", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.add });
    expect(result.success).toBe(false);
    expect(result.message).toContain("at least one description is required");
  });

  it("executes batch add action", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.add, descriptions: ["A", "B"] });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Added 2 quests");
    expect(log.getAll()).toHaveLength(2);
  });

  it("returns error for batch add with empty descriptions", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.add, descriptions: ["A", "", "B"] });
    expect(result.success).toBe(false);
    expect(result.message).toContain("all descriptions in a batch must be non-empty");
    expect(log.getAll()).toHaveLength(0);
  });

  it("executes list action", () => {
    const log = new QuestLog();
    log.add("A");
    const result = log.execute({ type: QUEST_ACTIONS.list });
    expect(result.success).toBe(true);
    expect(result.message).toContain("A");
  });

  it("executes toggle action", () => {
    const log = new QuestLog();
    log.add("A");
    const result = log.execute({ type: QUEST_ACTIONS.toggle, id: "01" });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Quest [01] done");
    expect(log.getAll()[0]!.done).toBe(true);
  });

  it("returns error for toggle without id", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.toggle });
    expect(result.success).toBe(false);
    expect(result.message).toContain("id is required");
  });

  it("returns not found for toggle of missing quest", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.toggle, id: "ff" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("executes update action", () => {
    const log = new QuestLog();
    log.add("Old");
    const result = log.execute({ type: QUEST_ACTIONS.update, id: "01", description: "New" });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Updated quest [01]");
    expect(log.getAll()[0]!.description).toBe("New");
  });

  it("returns error for update without id", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.update, description: "X" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("id is required");
  });

  it("returns error for update without description", () => {
    const log = new QuestLog();
    log.add("Old");
    const result = log.execute({ type: QUEST_ACTIONS.update, id: "01" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("description is required");
  });

  it("returns error for update with whitespace-only description", () => {
    const log = new QuestLog();
    log.add("Old");
    const result = log.execute({ type: QUEST_ACTIONS.update, id: "01", description: "   " });
    expect(result.success).toBe(false);
    expect(result.message).toContain("description is required");
  });

  it("executes delete action", () => {
    const log = new QuestLog();
    log.add("Old");
    const result = log.execute({ type: QUEST_ACTIONS.delete, id: "01" });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Deleted quest [01]");
    expect(log.getAll()).toHaveLength(0);
  });

  it("returns error for delete without id", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.delete });
    expect(result.success).toBe(false);
    expect(result.message).toContain("id is required");
  });

  it("executes clear action with all flag", () => {
    const log = new QuestLog();
    log.add("A");
    const result = log.execute({ type: QUEST_ACTIONS.clear, all: true });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Cleared 1 quests");
    expect(log.getAll()).toHaveLength(0);
  });

  it("executes clear action defaulting to done-only and keeps ids stable", () => {
    const log = new QuestLog();
    const a = log.add("A");
    const b = log.add("B");
    log.toggle(a.id);
    const result = log.execute({ type: QUEST_ACTIONS.clear });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Cleared 1 completed quests");
    expect(log.getAll()).toHaveLength(1);
    expect(log.getAll()[0]?.id).toBe(b.id);
    expect(log.getAll()[0]?.description).toBe("B");
  });

  it("executes reorder action", () => {
    const log = new QuestLog();
    log.add("A");
    const b = log.add("B");
    const result = log.execute({ type: QUEST_ACTIONS.reorder, id: b.id, targetId: "01" });
    expect(result.success).toBe(true);
    expect(result.message).toContain(`Reordered quest [${b.id}]`);
    expect(log.getAll().map((q) => q.description)).toEqual(["B", "A"]);
    expect(log.getAll().map((q) => q.id)).toEqual([b.id, "01"]);
  });

  it("returns error for reorder without id", () => {
    const log = new QuestLog();
    log.add("A");
    const result = log.execute({ type: QUEST_ACTIONS.reorder, targetId: "01" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("id is required");
  });

  it("returns error for reorder without targetId", () => {
    const log = new QuestLog();
    const b = log.add("B");
    const result = log.execute({ type: QUEST_ACTIONS.reorder, id: b.id });
    expect(result.success).toBe(false);
    expect(result.message).toContain("targetId is required");
  });

  it("returns not found for reorder of missing quest", () => {
    const log = new QuestLog();
    const result = log.execute({ type: QUEST_ACTIONS.reorder, id: "ff", targetId: "01" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("returns not found for reorder with missing targetId", () => {
    const log = new QuestLog();
    const b = log.add("B");
    const result = log.execute({ type: QUEST_ACTIONS.reorder, id: b.id, targetId: "ff" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("returns error when all quest IDs are exhausted", () => {
    const log = new QuestLog();
    (log as unknown as { usedIds: Set<string> }).usedIds = new Set(
      Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0")),
    );
    const result = log.execute({ type: QUEST_ACTIONS.add, descriptions: ["Test"] });
    expect(result.success).toBe(false);
    expect(result.message).toContain("No available quest IDs");
    expect(result.message).toContain("Clear done or all quests");
  });

  it("executes revert action", () => {
    const log = new QuestLog();
    log.add("A");
    const result = log.execute({ type: QUEST_ACTIONS.revert });
    expect(result.success).toBe(true);
    expect(result.message).toContain("Reverted add quest [01]");
    expect(log.getAll()).toHaveLength(0);
  });
});
