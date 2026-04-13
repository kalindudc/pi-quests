import { describe, expect, it } from "vitest";
import {
  formatAddResult,
  formatBatchAddResult,
  formatBlockedBySubQuests,
  formatDeleteResult,
  formatNotFound,
  formatQuestList,
  formatToggleResult,
  formatUpdateResult,
} from "../../src/quest/formatters.js";

describe("formatQuestList", () => {
  it("renders quests with positional numbers and hex ids", () => {
    const result = formatQuestList([
      { id: "05", description: "A", done: true },
      { id: "0a", description: "B", done: false },
    ]);
    expect(result).toBe("#1 [05] [x] A\n#2 [0a] [ ] B");
  });

  it("shows empty state", () => {
    expect(formatQuestList([])).toBe("No quests.");
  });

  it("skips positional numbers for sub-quests and indents them", () => {
    const result = formatQuestList([
      { id: "01", description: "Parent", done: false },
      { id: "02", description: "Sub", done: false, parentId: "01" },
    ]);
    expect(result).toBe("#1 [01] [ ] Parent\n   [02] [ ] Sub");
  });
});

describe("formatAddResult", () => {
  it("formats correctly", () => {
    expect(formatAddResult({ id: "01", description: "Test" })).toBe("Added quest [01]: Test");
  });
});

describe("formatBatchAddResult", () => {
  it("formats correctly", () => {
    expect(formatBatchAddResult([{ id: "01", description: "A" }])).toBe("Added 1 quests:\n[01]: A");
  });
});

describe("formatToggleResult", () => {
  it("formats done", () => {
    expect(formatToggleResult("01", true)).toBe("Quest [01] done");
  });

  it("formats undone", () => {
    expect(formatToggleResult("01", false)).toBe("Quest [01] undone");
  });
});

describe("formatUpdateResult", () => {
  it("formats correctly", () => {
    expect(formatUpdateResult({ id: "01", description: "New" })).toBe("Updated quest [01]: New");
  });
});

describe("formatDeleteResult", () => {
  it("formats correctly", () => {
    expect(formatDeleteResult({ id: "01", description: "Old" })).toBe("Deleted quest [01]: Old");
  });
});

describe("formatNotFound", () => {
  it("formats correctly", () => {
    expect(formatNotFound("ff")).toBe("Quest [ff] not found");
  });
});

describe("formatBlockedBySubQuests", () => {
  it("formats correctly", () => {
    expect(formatBlockedBySubQuests("01")).toBe("Quest [01] has incomplete sub-quests");
  });
});
