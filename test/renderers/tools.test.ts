import type { AgentToolResult, Theme } from "@mariozechner/pi-coding-agent";
import type { Text } from "@mariozechner/pi-tui";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config.js";
import { QuestLog } from "../../src/quest/dataplane.js";
import { QUEST_ACTIONS } from "../../src/quest/types.js";
import { renderQuestCall, renderQuestResult } from "../../src/renderers/tools.js";

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
  const render = renderQuestResult(DEFAULT_CONFIG);

  it("renders full quest list with positional numbers and hex ids", () => {
    const log = new QuestLog();
    log.add("Done quest");
    log.toggle("01");
    log.add("Pending quest");
    const toolResult: AgentToolResult<unknown> = {
      content: [{ type: "text", text: "" }],
      details: {
        quests: log.getAll(),
      },
    };
    const result = render(toolResult, { expanded: false, isPartial: false }, mockTheme, {});
    const text = getText(result);
    expect(text).toContain("[01] #1");
    expect(text).toContain("Done quest");
    expect(text).toContain("[02] #2");
    expect(text).toContain("Pending quest");
  });

  it("renders displayQuests with positional numbers and hex ids from full list", () => {
    const log = new QuestLog();
    log.add("Done quest");
    log.toggle("01");
    log.add("Pending quest");
    const toolResult: AgentToolResult<unknown> = {
      content: [{ type: "text", text: "" }],
      details: {
        quests: log.getAll(),
        displayQuests: [log.getAll()[1]!],
      },
    };
    const result = render(toolResult, { expanded: false, isPartial: false }, mockTheme, {});
    const text = getText(result);
    expect(text).not.toContain("[01] #1");
    expect(text).not.toContain("Done quest");
    expect(text).toContain("[02] #2");
    expect(text).toContain("Pending quest");
  });

  it("falls back to plain text when no quests are present", () => {
    const result = render(
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

  it("renders steps indented without positional numbers", () => {
    const log = new QuestLog();
    log.add("Parent");
    log.addStep("Sub", "01");
    const toolResult: AgentToolResult<unknown> = {
      content: [{ type: "text", text: "" }],
      details: {
        quests: log.getAll(),
      },
    };
    const result = render(toolResult, { expanded: false, isPartial: false }, mockTheme, {});
    const text = getText(result);
    expect(text).toContain("[01] #1");
    expect(text).toContain("[02]");
    expect(text).toContain("Sub");
    expect(text).not.toContain("#2");
  });

  it("adds blank lines around step groups", () => {
    const log = new QuestLog();
    log.add("Parent A");
    log.addStep("Sub A1", "01");
    log.addStep("Sub A2", "01");
    log.add("Parent B");
    const toolResult: AgentToolResult<unknown> = {
      content: [{ type: "text", text: "" }],
      details: {
        quests: log.getAll(),
      },
    };
    const result = render(toolResult, { expanded: false, isPartial: false }, mockTheme, {});
    const text = getText(result);
    const lines = text.split("\n");
    const parentAIdx = lines.findIndex((l) => l.includes("Parent A"));
    const subA1Idx = lines.findIndex((l) => l.includes("Sub A1"));
    const subA2Idx = lines.findIndex((l) => l.includes("Sub A2"));
    const parentBIdx = lines.findIndex((l) => l.includes("Parent B"));

    expect(lines[subA1Idx - 1]).contain("│");
    expect(lines[subA2Idx + 1]).toBe("");
    expect(subA1Idx).toBe(parentAIdx + 2);
    expect(parentBIdx).toBe(subA2Idx + 2);
  });
});
