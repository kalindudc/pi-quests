import { describe, expect, it, vi } from "vitest";
import { createQuestsHandler, parseQuestArgs } from "../../src/commands/quests.js";
import { QuestLog } from "../../src/quests.js";
import { VERSION } from "../../src/version.js";

vi.mock("../../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

describe("quests command handler", () => {
  function createMockPi() {
    return {
      sendMessage: vi.fn(),
    } as unknown as Parameters<typeof createQuestsHandler>[0];
  }

  function createMockCtx() {
    return {
      ui: {
        notify: vi.fn(),
        custom: vi.fn().mockResolvedValue(undefined),
      },
      hasUI: true,
    } as unknown as Parameters<ReturnType<typeof createQuestsHandler>>[1];
  }

  function createHandler() {
    return createQuestsHandler(createMockPi(), new QuestLog());
  }

  it("shows version for 'version' subcommand", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("version", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith(`pi-quests v${VERSION}`, "info");
  });

  it("sends a quest-changelog message for 'changelog' subcommand", async () => {
    const pi = createMockPi();
    const ctx = createMockCtx();
    const handler = createQuestsHandler(pi, new QuestLog());
    await handler("changelog", ctx);
    expect(pi.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "quest-changelog",
        display: true,
        details: expect.objectContaining({
          content: expect.stringContaining("pi-quests Changelog"),
        }),
      }),
    );
  });

  it("shows usage for unknown subcommand", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("unknown", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith(
      "Unknown subcommand: unknown. Use /quests help to see available commands.",
      "error",
    );
  });

  it("lists quests when called with no args", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("", ctx);
    expect(ctx.ui.custom).toHaveBeenCalled();
  });

  it("adds a quest", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add Test quest", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Added quest #1", "info");
  });

  it("lists quests with custom UI", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add A", ctx);
    await handler("list", ctx);
    expect(ctx.ui.custom).toHaveBeenCalled();
  });

  it("shows error for list without UI", async () => {
    const ctx = createMockCtx();
    ctx.hasUI = false;
    const handler = createHandler();
    await handler("list", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Interactive mode required", "error");
  });

  it("toggles a quest", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add Toggle me", ctx);
    await handler("toggle 1", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Quest #1 done", "info");
    await handler("toggle 1", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Quest #1 undone", "info");
  });

  it("shows error when toggling nonexistent quest", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("toggle 999", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Quest #999 not found", "error");
  });

  it("updates a quest", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add Old desc", ctx);
    await handler("update 1 New desc", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Updated quest #1: New desc", "info");
  });

  it("shows error when updating nonexistent quest", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("update 999 Missing", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Quest #999 not found", "error");
  });

  it("deletes a quest", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add Delete me", ctx);
    await handler("delete 1", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Deleted quest #1: Delete me", "info");
  });

  it("shows error when deleting nonexistent quest", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("delete 999", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Quest #999 not found", "error");
  });

  it("clears quests", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add A", ctx);
    await handler("clear", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Cleared 1 quests", "info");
  });

  it("reverts last action", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add A", ctx);
    await handler("revert", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining("Reverted"), "info");
  });

  it("shows error when nothing to revert", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("revert", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Nothing to revert", "error");
  });

  it("shows help via notify", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("help", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith(
      expect.stringContaining("Available /quests subcommands"),
      "info",
    );
  });
});

describe("parseQuestArgs", () => {
  it("parses version", () => {
    expect(parseQuestArgs("version")).toEqual({ action: "version" });
  });

  it("parses changelog", () => {
    expect(parseQuestArgs("changelog")).toEqual({ action: "changelog" });
  });

  it("parses help", () => {
    expect(parseQuestArgs("help")).toEqual({ action: "help" });
    expect(parseQuestArgs("h")).toEqual({ action: "help" });
  });

  it("parses list", () => {
    expect(parseQuestArgs("list")).toEqual({ action: "list" });
  });

  it("parses clear", () => {
    expect(parseQuestArgs("clear")).toEqual({ action: "clear" });
  });

  it("parses add with description", () => {
    expect(parseQuestArgs("add Buy milk")).toEqual({ action: "add", description: "Buy milk" });
  });

  it("returns error for add without description", () => {
    expect(parseQuestArgs("add")).toEqual({ error: "Usage: /quests add <description>" });
  });

  it("parses toggle with id", () => {
    expect(parseQuestArgs("toggle 3")).toEqual({ action: "toggle", id: 3 });
  });

  it("returns error for toggle without id", () => {
    expect(parseQuestArgs("toggle")).toEqual({ error: "Usage: /quests toggle <id>" });
  });

  it("returns error for toggle with invalid id", () => {
    expect(parseQuestArgs("toggle abc")).toEqual({ error: "Usage: /quests toggle <id>" });
  });

  it("parses revert", () => {
    expect(parseQuestArgs("revert")).toEqual({ action: "revert" });
  });

  it("parses update with id and description", () => {
    expect(parseQuestArgs("update 3 New desc")).toEqual({
      action: "update",
      id: 3,
      description: "New desc",
    });
  });

  it("returns error for update without id", () => {
    expect(parseQuestArgs("update")).toEqual({ error: "Usage: /quests update <id> <description>" });
  });

  it("returns error for update without description", () => {
    expect(parseQuestArgs("update 1")).toEqual({
      error: "Usage: /quests update <id> <description>",
    });
  });

  it("parses delete with id", () => {
    expect(parseQuestArgs("delete 3")).toEqual({ action: "delete", id: 3 });
  });

  it("returns error for delete without id", () => {
    expect(parseQuestArgs("delete")).toEqual({ error: "Usage: /quests delete <id>" });
  });

  it("returns error for unknown subcommand", () => {
    expect(parseQuestArgs("unknown")).toEqual({
      error: "Unknown subcommand: unknown. Use /quests help to see available commands.",
    });
  });

  it("treats empty args as list", () => {
    expect(parseQuestArgs("")).toEqual({ action: "list" });
  });
});
