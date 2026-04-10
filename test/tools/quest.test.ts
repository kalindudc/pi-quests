import { describe, expect, it } from "vitest";
import { QuestLog } from "../../src/quests.js";
import { questToolExecute } from "../../src/tools/quest.js";

function getText(content: { type: "text"; text: string } | { type: "image" }): string | undefined {
  return content.type === "text" ? content.text : undefined;
}

describe("quest tool", () => {
  function createLog() {
    return new QuestLog();
  }

  it("adds a quest", async () => {
    const log = createLog();
    const result = await questToolExecute(log, "tc1", { action: "add", description: "Test" });
    expect(result.content[0]).toEqual(
      expect.objectContaining({ text: expect.stringContaining("Added quest #1") }),
    );
  });

  it("adds multiple quests in batch", async () => {
    const log = createLog();
    const result = await questToolExecute(log, "tc1", {
      action: "add",
      descriptions: ["A", "B"],
    });
    expect(getText(result.content[0]!)).toContain("Added 2 quests");
    expect(log.getAll()).toHaveLength(2);
  });

  it("lists quests", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: "list" });
    expect(getText(result.content[0]!)).toContain("A");
  });

  it("toggles a quest", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: "toggle", id: 1 });
    expect(getText(result.content[0]!)).toContain("Quest #1 done");
  });

  it("clears quests", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: "clear" });
    expect(getText(result.content[0]!)).toContain("Cleared 1");
  });

  it("updates a quest", async () => {
    const log = createLog();
    log.add("Old");
    const result = await questToolExecute(log, "tc1", {
      action: "update",
      id: 1,
      description: "New",
    });
    expect(getText(result.content[0]!)).toContain("Updated quest #1");
    expect(log.getAll()[0]?.description).toBe("New");
  });

  it("deletes a quest", async () => {
    const log = createLog();
    log.add("Old");
    const result = await questToolExecute(log, "tc1", { action: "delete", id: 1 });
    expect(getText(result.content[0]!)).toContain("Deleted quest #1");
    expect(log.getAll()).toHaveLength(0);
  });

  it("reverts last action", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: "revert" });
    expect(getText(result.content[0]!)).toContain("Reverted add quest #1");
  });
});
