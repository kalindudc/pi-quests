import { describe, expect, it, vi } from "vitest";
import { QUEST_ACTIONS } from "../../src/quest/types.js";
import { renderQuestCall, renderQuestResult } from "../../src/renderers/tools.js";

vi.mock("../../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

const mockTheme = {
  fg: (_name: string, text: string) => text,
  bold: (text: string) => text,
} as unknown as import("@mariozechner/pi-coding-agent").Theme;

function getText(widget: import("@mariozechner/pi-tui").Text): string {
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
    const result = renderQuestCall({ action: QUEST_ACTIONS.toggle, id: 3 }, mockTheme, {});
    expect(getText(result)).toContain("quest toggle");
    expect(getText(result)).toContain("#3");
  });

  it("renders revert action", () => {
    const result = renderQuestCall({ action: QUEST_ACTIONS.revert }, mockTheme, {});
    expect(getText(result)).toContain("quest revert");
  });
});

describe("renderQuestResult", () => {
  it("renders full quest list when only quests are present", () => {
    const result = renderQuestResult(
      {
        content: [{ type: "text", text: "" }],
        details: {
          quests: [
            { id: 1, description: "Done quest", done: true },
            { id: 2, description: "Pending quest", done: false },
          ],
        },
      },
      { expanded: false, isPartial: false },
      mockTheme,
      {},
    );
    const text = getText(result);
    expect(text).toContain("#1");
    expect(text).toContain("Done quest");
    expect(text).toContain("#2");
    expect(text).toContain("Pending quest");
  });

  it("renders displayQuests when present instead of full quests", () => {
    const result = renderQuestResult(
      {
        content: [{ type: "text", text: "" }],
        details: {
          quests: [
            { id: 1, description: "Done quest", done: true },
            { id: 2, description: "Pending quest", done: false },
          ],
          displayQuests: [{ id: 2, description: "Pending quest", done: false }],
        },
      },
      { expanded: false, isPartial: false },
      mockTheme,
      {},
    );
    const text = getText(result);
    expect(text).not.toContain("#1");
    expect(text).not.toContain("Done quest");
    expect(text).toContain("#2");
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
