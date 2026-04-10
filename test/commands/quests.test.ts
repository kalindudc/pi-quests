import { describe, expect, it, vi } from "vitest";
import { createQuestsHandler } from "../../src/commands/quests.js";
import { VERSION } from "../../src/version.js";

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
      },
    } as unknown as Parameters<ReturnType<typeof createQuestsHandler>>[1];
  }

  it("shows version for 'version' subcommand", async () => {
    const pi = createMockPi();
    const ctx = createMockCtx();
    const handler = createQuestsHandler(pi);
    await handler("version", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith(`pi-quests v${VERSION}`, "info");
  });

  it("sends a quest-changelog message for 'changelog' subcommand", async () => {
    const pi = createMockPi();
    const ctx = createMockCtx();
    const handler = createQuestsHandler(pi);
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
    const pi = createMockPi();
    const ctx = createMockCtx();
    const handler = createQuestsHandler(pi);
    await handler("unknown", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Usage: /quests [version | changelog]", "error");
  });

  it("shows usage when called with no args", async () => {
    const pi = createMockPi();
    const ctx = createMockCtx();
    const handler = createQuestsHandler(pi);
    await handler("", ctx);
    expect(ctx.ui.notify).toHaveBeenCalledWith("Usage: /quests [version | changelog]", "error");
  });
});
