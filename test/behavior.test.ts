import { describe, expect, it, vi } from "vitest";
import { createQuestsHandler } from "../src/commands/handler.js";
import { QuestLog } from "../src/quest/dataplane.js";
import { QUEST_ACTIONS } from "../src/quest/types.js";
import { questToolExecute } from "../src/tools/handler.js";

vi.mock("../src/logger.js", () => ({ logger: { debug: vi.fn() } }));

function createMockCtx() {
  return {
    ui: {
      notify: vi.fn(),
      custom: vi.fn().mockResolvedValue(undefined),
    },
    hasUI: true,
  } as unknown as Parameters<ReturnType<typeof createQuestsHandler>>[1];
}

function createCommandHandler(log: QuestLog) {
  return createQuestsHandler(
    { sendMessage: vi.fn() } as unknown as Parameters<typeof createQuestsHandler>[0],
    log,
  );
}

describe("quest behavior", () => {
  describe("command flow", () => {
    it("adds a quest via command and lists it through the dataplane", async () => {
      const log = new QuestLog();
      const handler = createCommandHandler(log);
      const ctx = createMockCtx();

      await handler("add Test quest", ctx);
      expect(log.getAll()).toHaveLength(1);
      expect(log.getAll()[0]!.description).toBe("Test quest");
      expect(ctx.ui.notify).toHaveBeenCalledWith("Added quest #1: Test quest", "info");

      await handler("list", ctx);
      expect(ctx.ui.custom).toHaveBeenCalled();
    });

    it("toggles and reverts through the command adapter", async () => {
      const log = new QuestLog();
      const handler = createCommandHandler(log);
      const ctx = createMockCtx();

      await handler("add Toggle me", ctx);
      await handler("toggle 1", ctx);
      expect(log.getAll()[0]!.done).toBe(true);
      expect(ctx.ui.notify).toHaveBeenCalledWith("Quest #1 done", "info");

      await handler("revert", ctx);
      expect(log.getAll()[0]!.done).toBe(false);
    });

    it("reconstructs session state and continues accepting commands", async () => {
      const log = new QuestLog();
      const entries = [
        {
          type: "message",
          message: {
            role: "toolResult",
            toolName: "quest",
            details: {
              quests: [{ id: 1, description: "Restored", done: false, createdAt: 1 }],
              nextId: 2,
            },
          },
        },
      ];
      const ctx = createMockCtx();
      const sessionCtx = {
        sessionManager: { getBranch: vi.fn().mockReturnValue(entries) },
      } as unknown as import("@mariozechner/pi-coding-agent").ExtensionContext;

      log.reconstructFromSession(sessionCtx);
      expect(log.getAll()).toHaveLength(1);

      const handler = createCommandHandler(log);
      await handler("toggle 1", ctx);
      expect(log.getAll()[0]!.done).toBe(true);
    });
  });

  describe("tool flow", () => {
    it("adds a quest via tool and toggles it", async () => {
      const log = new QuestLog();
      await questToolExecute(log, "tc1", {
        action: QUEST_ACTIONS.add,
        description: "Test",
      });
      expect(log.getAll()).toHaveLength(1);

      const result = await questToolExecute(log, "tc2", {
        action: QUEST_ACTIONS.toggle,
        id: 1,
      });
      expect(log.getAll()[0]!.done).toBe(true);
      expect(getText(result.content[0]!)).toContain("Quest #1 done");
    });

    it("batch add then clear restores correctly via revert", async () => {
      const log = new QuestLog();
      await questToolExecute(log, "tc1", {
        action: QUEST_ACTIONS.add,
        descriptions: ["A", "B"],
      });
      expect(log.getAll()).toHaveLength(2);

      await questToolExecute(log, "tc2", { action: QUEST_ACTIONS.clear });
      expect(log.getAll()).toHaveLength(0);

      const result = await questToolExecute(log, "tc3", { action: QUEST_ACTIONS.revert });
      expect(log.getAll()).toHaveLength(2);
      expect(getText(result.content[0]!)).toContain("Reverted clear");
    });
  });
});

function getText(content: { type: "text"; text: string } | { type: "image" }): string | undefined {
  return content.type === "text" ? content.text : undefined;
}
