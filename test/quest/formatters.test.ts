import { describe, expect, it } from "vitest";
import {
  formatAddResult,
  formatBatchAddResult,
  formatClearResult,
  formatDeleteResult,
  formatNotFound,
  formatQuestList,
  formatToggleResult,
  formatUpdateResult,
} from "../../src/quest/formatters.js";

describe("formatQuestList", () => {
  it("renders quests with positional numbers", () => {
    const result = formatQuestList([
      { id: 5, description: "A", done: true },
      { id: 10, description: "B", done: false },
    ]);
    expect(result).toBe("#1 [x] A\n#2 [ ] B");
  });

  it("shows empty state", () => {
    expect(formatQuestList([])).toBe("No quests.");
  });
});

describe("formatAddResult", () => {
  it("formats correctly", () => {
    expect(formatAddResult({ id: 1, description: "Test" })).toBe("Added quest #1: Test");
  });
});

describe("formatBatchAddResult", () => {
  it("formats correctly", () => {
    expect(formatBatchAddResult([{ id: 1, description: "A" }])).toBe("Added 1 quests:\n#1: A");
  });
});

describe("formatToggleResult", () => {
  it("formats done", () => {
    expect(formatToggleResult(1, true)).toBe("Quest #1 done");
  });

  it("formats undone", () => {
    expect(formatToggleResult(1, false)).toBe("Quest #1 undone");
  });
});

describe("formatUpdateResult", () => {
  it("formats correctly", () => {
    expect(formatUpdateResult({ id: 1, description: "New" })).toBe("Updated quest #1: New");
  });
});

describe("formatDeleteResult", () => {
  it("formats correctly", () => {
    expect(formatDeleteResult({ id: 1, description: "Old" })).toBe("Deleted quest #1: Old");
  });
});

describe("formatClearResult", () => {
  it("formats correctly", () => {
    expect(formatClearResult(3)).toBe("Cleared 3 quests");
  });
});

describe("formatNotFound", () => {
  it("formats correctly", () => {
    expect(formatNotFound(99)).toBe("Quest #99 not found");
  });
});
