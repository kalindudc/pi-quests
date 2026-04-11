import type { Theme } from "@mariozechner/pi-coding-agent";
import type { Text } from "@mariozechner/pi-tui";
import { describe, expect, it, vi } from "vitest";
import { QUEST_ACTIONS } from "../../src/quest/types.js";
import { renderQuestCall, renderQuestResult } from "../../src/renderers/tools.js";

vi.mock("../../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

const mockTheme = {
  fg: (_name: string, text: string) => text,
  bold: (text: string) => text,
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
  it("renders full quest list with positional numbers", () => {
    const result = renderQuestResult(
      {
        content: [{ type: "text", text: "" }],
        details: {
          quests: [
            { id: 5, description: "Done quest", done: true },
            { id: 10, description: "Pending quest", done: false },
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

  it("renders displayQuests with positional numbers from full list", () => {
    const result = renderQuestResult(
      {
        content: [{ type: "text", text: "" }],
        details: {
          quests: [
            { id: 5, description: "Done quest", done: true },
            { id: 10, description: "Pending quest", done: false },
          ],
          displayQuests: [{ id: 10, description: "Pending quest", done: false }],
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
