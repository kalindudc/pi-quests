import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
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
      registerShortcut: vi.fn(),
      _handlers: handlers,
    };
  }

  it("injects Quest Management section into system prompt", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as ExtensionAPI);
    const handler = pi._handlers.before_agent_start[0];
    const result = await handler({ systemPrompt: "base" });
    expect(result.systemPrompt).toContain("Quest Management");
    expect(result.systemPrompt).toContain("VERY frequently");
    expect(result.systemPrompt).toContain("critical that you toggle quests to done");
    expect(result.systemPrompt).toContain(
      "Before reading files, running commands, or making edits",
    );
    expect(result.systemPrompt).toContain("sub-quest");
    expect(result.systemPrompt).toContain("parentId");
  });

  it("includes active quests in the reminder", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as ExtensionAPI);
    const branch = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "quest",
          details: {
            quests: [{ id: "01", description: "Test task", done: false, createdAt: 1 }],
          },
        },
      },
    ];
    await pi._handlers.session_start[0](
      {},
      { cwd: "/tmp", sessionManager: { getBranch: vi.fn().mockReturnValue(branch) } },
    );
    const result = await pi._handlers.before_agent_start[0]({ systemPrompt: "base" });
    expect(result.systemPrompt).toContain("Test task");
    expect(result.systemPrompt).toContain("Keep quest progress updated");
  });

  it("nudges via context after 8 non-quest tools with 0 active quests", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as ExtensionAPI);
    for (let i = 0; i < 8; i++) await pi._handlers.tool_execution_end[0]({ toolName: "read" });
    const result = await pi._handlers.context[0]({ messages: [] });
    expect(result.messages).toHaveLength(1);
    expect((result.messages[0] as { content: string }).content).toContain("QUEST REMINDER");
    expect((result.messages[0] as { content: string }).content).toContain(
      "Update your quest status before continuing",
    );
  });

  it("nudges via context on first tool use before any quest call", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as ExtensionAPI);
    for (let i = 0; i < 8; i++) await pi._handlers.tool_execution_end[0]({ toolName: "bash" });
    expect((await pi._handlers.context[0]({ messages: [] })).messages).toHaveLength(1);
  });

  it("nudges for complex prompt when 0 active quests exist", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as ExtensionAPI);
    const result = await pi._handlers.context[0]({
      messages: [{ role: "user", content: "Refactor the auth module", timestamp: 1 }],
    });
    expect(result.messages).toHaveLength(2);
    expect((result.messages[1] as { content: string }).content).toContain("QUEST REMINDER");
  });

  it("nudges at most once per turn", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as ExtensionAPI);
    for (let i = 0; i < 8; i++) await pi._handlers.tool_execution_end[0]({ toolName: "read" });
    const first = await pi._handlers.context[0]({ messages: [] });
    expect(first.messages).toHaveLength(1);
    expect(await pi._handlers.context[0]({ messages: [] })).toBeUndefined();
  });

  it("registers shortcut during extension init", async () => {
    const pi = createMockPi();
    const { default: init } = await import("../src/index.js");
    init(pi as unknown as ExtensionAPI);
    expect(pi.registerShortcut).toHaveBeenCalledWith(
      "ctrl+shift+l",
      expect.objectContaining({ description: "Open quest list" }),
    );
  });
});
