import { describe, expect, it, vi } from "vitest";
import { QuestLog } from "../../src/quest/dataplane.js";
import { QUEST_ACTIONS } from "../../src/quest/types.js";
import { questToolExecute, registerQuestTool } from "../../src/tools/handler.js";

function getText(content: { type: "text"; text: string } | { type: "image" }): string | undefined {
  return content.type === "text" ? content.text : undefined;
}

describe("questToolExecute", () => {
  function createLog() {
    return new QuestLog();
  }

  it("adds a quest", async () => {
    const log = createLog();
    const result = await questToolExecute(log, "tc1", {
      action: QUEST_ACTIONS.add,
      descriptions: ["Test"],
    });
    expect(result.content[0]).toEqual(
      expect.objectContaining({ text: expect.stringContaining("Added 1 quests") }),
    );
  });

  it("adds multiple quests in batch", async () => {
    const log = createLog();
    const result = await questToolExecute(log, "tc1", {
      action: QUEST_ACTIONS.add,
      descriptions: ["A", "B"],
    });
    expect(getText(result.content[0]!)).toContain("Added 2 quests");
    expect(log.getAll()).toHaveLength(2);
  });

  it("lists quests", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.list });
    expect(getText(result.content[0]!)).toContain("A");
  });

  it("toggles a quest", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.toggle, id: 1 });
    expect(getText(result.content[0]!)).toContain("Quest #1 done");
  });

  it("clears quests", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.clear, all: true });
    expect(getText(result.content[0]!)).toContain("Cleared 1");
  });

  it("updates a quest", async () => {
    const log = createLog();
    log.add("Old");
    const result = await questToolExecute(log, "tc1", {
      action: QUEST_ACTIONS.update,
      id: 1,
      description: "New",
    });
    expect(getText(result.content[0]!)).toContain("Updated quest #1");
    expect(log.getAll()[0]?.description).toBe("New");
  });

  it("deletes a quest", async () => {
    const log = createLog();
    log.add("Old");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.delete, id: 1 });
    expect(getText(result.content[0]!)).toContain("Deleted quest #1");
    expect(log.getAll()).toHaveLength(0);
  });

  it("reverts last action", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.revert });
    expect(getText(result.content[0]!)).toContain("Reverted add quest #1");
  });

  it("includes full quest list in details for add action", async () => {
    const log = createLog();
    const result = await questToolExecute(log, "tc1", {
      action: QUEST_ACTIONS.add,
      descriptions: ["A", "B"],
    });
    const details = result.details as { quests: unknown[]; displayQuests?: unknown[] };
    expect(details.quests).toHaveLength(2);
    expect(details.displayQuests).toEqual(details.quests);
  });

  it("includes only affected quest in displayQuests for toggle", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.toggle, id: 1 });
    const details = result.details as { quests: unknown[]; displayQuests?: unknown[] };
    expect(details.quests).toHaveLength(1);
    expect(details.displayQuests).toHaveLength(1);
    expect((details.displayQuests![0] as { done: boolean }).done).toBe(true);
  });

  it("includes only affected quest in displayQuests for update", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", {
      action: QUEST_ACTIONS.update,
      id: 1,
      description: "B",
    });
    const details = result.details as { quests: unknown[]; displayQuests?: unknown[] };
    expect(details.quests).toHaveLength(1);
    expect(details.displayQuests).toHaveLength(1);
    expect((details.displayQuests![0] as { description: string }).description).toBe("B");
  });

  it("includes only affected quest in displayQuests for delete", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.delete, id: 1 });
    const details = result.details as { quests: unknown[]; displayQuests?: unknown[] };
    expect(details.quests).toHaveLength(0);
    expect(details.displayQuests).toHaveLength(1);
    expect((details.displayQuests![0] as { description: string }).description).toBe("A");
  });

  it("omits displayQuests for clear", async () => {
    const log = createLog();
    log.add("A");
    const result = await questToolExecute(log, "tc1", { action: QUEST_ACTIONS.clear, all: true });
    const details = result.details as { quests: unknown[]; displayQuests?: unknown[] };
    expect(details.quests).toHaveLength(0);
    expect(details.displayQuests).toBeUndefined();
  });
});

describe("registerQuestTool", () => {
  it("registers quest tool with promptSnippet and promptGuidelines", () => {
    const pi = {
      registerTool: vi.fn(),
    };
    const log = new QuestLog();
    registerQuestTool(pi as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI, log);
    expect(pi.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "quest",
        promptSnippet: expect.any(String),
        promptGuidelines: expect.arrayContaining([
          expect.stringContaining("Before reading files, running commands, or making edits"),
        ]),
      }),
    );
  });
});
