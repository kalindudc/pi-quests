import { describe, expect, it, vi } from "vitest";
import { createQuestsHandler } from "../../src/commands/handler.js";
import { QuestLog } from "../../src/quest/dataplane.js";
import { getVersion } from "../../src/version.js";

vi.mock("../../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

describe("createQuestsHandler", () => {
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
    expect(ctx.ui.notify).toHaveBeenCalledWith(`pi-quests v${getVersion()}`, "info");
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
    expect(ctx.ui.notify).toHaveBeenCalledWith("Added 1 quests:\n#1: Test quest", "info");
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
    await handler("toggle 1", ctx);
    await handler("clear", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Cleared 1 completed quests", "info");
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

  it("reorders via command", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add A", ctx);
    await handler("add B", ctx);
    await handler("reorder 2 0", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Reordered quest #1: B", "info");
  });

  it("clears all via command with all arg", async () => {
    const ctx = createMockCtx();
    const handler = createHandler();
    await handler("add A", ctx);
    await handler("clear all", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Cleared 1 quests", "info");
  });
});
