import { describe, expect, it, vi } from "vitest";

describe("extension entry point", () => {
  function createMockPi() {
    const handlers: Record<string, Function[]> = {};
    return {
      on: vi.fn((event: string, handler: Function) => {
        handlers[event] = handlers[event] ?? [];
        handlers[event].push(handler);
      }),
      registerTool: vi.fn(),
      registerMessageRenderer: vi.fn(),
      registerCommand: vi.fn(),
      _handlers: handlers,
    };
  }

  it("injects Quest Management section into system prompt", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);
    const handler = pi._handlers.before_agent_start[0];
    const result = await handler({ systemPrompt: "base" });
    expect(result.systemPrompt).toContain("Quest Management");
    expect(result.systemPrompt).toContain("VERY frequently");
    expect(result.systemPrompt).toContain("critical that you toggle quests to done");
    expect(result.systemPrompt).toContain(
      "Before reading files, running commands, or making edits",
    );
  });

  it("includes active quests in the reminder", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);
    const branch = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "quest",
          details: {
            quests: [{ id: 1, description: "Test task", done: false, createdAt: 1 }],
            nextId: 2,
          },
        },
      },
    ];
    await pi._handlers.session_start[0](
      {},
      { sessionManager: { getBranch: vi.fn().mockReturnValue(branch) } },
    );
    const result = await pi._handlers.before_agent_start[0]({ systemPrompt: "base" });
    expect(result.systemPrompt).toContain("Test task");
  });
});
