import type { Theme } from "@mariozechner/pi-coding-agent";
import type { Text } from "@mariozechner/pi-tui";
import { describe, expect, it, vi } from "vitest";
import { QUEST_ACTIONS } from "../../src/quest/types.js";
import { renderQuestCall, renderQuestResult } from "../../src/renderers/tools.js";

vi.mock("../../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

const mockTheme = {
  fg: (_name: string, text: string) => text,
  bold: (text: string) => text,
  strikethrough: (text: string) => text,
} as unknown as Theme;

function getText(widget: Text): string {
  return (widget as unknown as { text: string }).text;
}

describe("renderQuestCall", () => {
  it("renders add action with descriptions count", () => {
    const result = renderQuestCall(
      { action: QUEST_ACTIONS.add, descriptions: ["Test quest"] },
      mockTheme,
      {},
    );
    expect(getText(result)).toContain("quest add");
    expect(getText(result)).toContain("[1 quest]");
  });

  it("renders batch add with count", () => {
    const result = renderQuestCall(
      { action: QUEST_ACTIONS.add, descriptions: ["A", "B"] },
      mockTheme,
      {},
    );
    expect(getText(result)).toContain("quest add");
    expect(getText(result)).toContain("[2 quests]");
  });

  it("renders toggle action with id", () => {
    const result = renderQuestCall({ action: QUEST_ACTIONS.toggle, id: "03" }, mockTheme, {});
    expect(getText(result)).toContain("quest toggle");
    expect(getText(result)).toContain("[03]");
  });

  it("renders revert action", () => {
    const result = renderQuestCall({ action: QUEST_ACTIONS.revert }, mockTheme, {});
    expect(getText(result)).toContain("quest revert");
  });

  it("renders reorder action with targetId", () => {
    const result = renderQuestCall(
      { action: QUEST_ACTIONS.reorder, targetId: "01" },
      mockTheme,
      {},
    );
    expect(getText(result)).toContain("quest reorder");
    expect(getText(result)).toContain("01");
  });

  it("renders clear action", () => {
    const result = renderQuestCall({ action: QUEST_ACTIONS.clear, all: true }, mockTheme, {});
    expect(getText(result)).toContain("quest clear");
    expect(getText(result)).toContain("[all]");
  });

  it("renders clear action without all flag", () => {
    const result = renderQuestCall({ action: QUEST_ACTIONS.clear, all: false }, mockTheme, {});
    expect(getText(result)).toContain("quest clear");
    expect(getText(result)).toContain("[done]");
  });
});

describe("renderQuestResult", () => {
  it("renders full quest list with positional numbers and hex ids", () => {
    const result = renderQuestResult(
      {
        content: [{ type: "text", text: "" }],
        details: {
          quests: [
            { id: "05", description: "Done quest", done: true },
            { id: "0a", description: "Pending quest", done: false },
          ],
        },
      },
      { expanded: false, isPartial: false },
      mockTheme,
      {},
    );
    const text = getText(result);
    expect(text).toContain("#1   [05]");
    expect(text).toContain("Done quest");
    expect(text).toContain("#2   [0a]");
    expect(text).toContain("Pending quest");
  });

  it("renders displayQuests with positional numbers and hex ids from full list", () => {
    const result = renderQuestResult(
      {
        content: [{ type: "text", text: "" }],
        details: {
          quests: [
            { id: "05", description: "Done quest", done: true },
            { id: "0a", description: "Pending quest", done: false },
          ],
          displayQuests: [{ id: "0a", description: "Pending quest", done: false }],
        },
      },
      { expanded: false, isPartial: false },
      mockTheme,
      {},
    );
    const text = getText(result);
    expect(text).not.toContain("#1   [05]");
    expect(text).not.toContain("Done quest");
    expect(text).toContain("#2   [0a]");
    expect(text).toContain("Pending quest");
  });

  it("falls back to plain text when no quests are present", () => {
    const result = renderQuestResult(
      {
        content: [{ type: "text", text: "All clear" }],
        details: {},
      },
      { expanded: false, isPartial: false },
      mockTheme,
      {},
    );
    expect(getText(result)).toContain("All clear");
  });
});
