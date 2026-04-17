import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, getConfig, type ResolvedConfig } from "../src/config.js";

describe("getConfig", () => {
  let originalAgentDir: string | undefined;
  let tempDir: string;

  beforeEach(() => {
    originalAgentDir = process.env.PI_CODING_AGENT_DIR;
    tempDir = mkdtempSync(join(tmpdir(), "pi-quests-config-test-"));
    process.env.PI_CODING_AGENT_DIR = tempDir;
  });

  afterEach(() => {
    if (originalAgentDir === undefined) {
      delete process.env.PI_CODING_AGENT_DIR;
    } else {
      process.env.PI_CODING_AGENT_DIR = originalAgentDir;
    }
  });

  function createMockContext(cwd: string): ExtensionContext {
    return { cwd } as ExtensionContext;
  }

  function writeGlobalSettings(settings: Record<string, unknown>): void {
    writeFileSync(join(tempDir, "settings.json"), JSON.stringify(settings));
  }

  function _writeProjectSettings(cwd: string, settings: Record<string, unknown>): void {
    const projectPiDir = join(cwd, ".pi");
    mkdirSync(projectPiDir, { recursive: true });
    writeFileSync(join(projectPiDir, "settings.json"), JSON.stringify(settings));
  }

  it("returns default config when no settings exist", () => {
    const ctx = createMockContext(tempDir);
    expect(getConfig(ctx)).toEqual(DEFAULT_CONFIG);
  });

  it("allows overriding display.icon", () => {
    const settingsPath = join(tempDir, ".pi", "settings.json");
    mkdirSync(join(tempDir, ".pi"), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify({ "pi-quests": { display: { icon: "★" } } }));
    const ctx = createMockContext(tempDir);
    expect(getConfig(ctx).display.icon).toBe("★");
  });

  it("applies shortcuts.openQuests override", () => {
    writeGlobalSettings({
      "pi-quests": {
        shortcuts: { openQuests: "ctrl+shift+q" },
      } as Partial<ResolvedConfig>,
    });
    const ctx = createMockContext(tempDir);
    const config = getConfig(ctx);
    expect(config.shortcuts?.openQuests).toBe("ctrl+shift+q");
  });

  it("applies global settings override", () => {
    writeGlobalSettings({
      "pi-quests": {
        ids: { length: 3 },
        display: { pageSize: 5 },
      } as Partial<ResolvedConfig>,
    });
    const ctx = createMockContext(tempDir);
    const config = getConfig(ctx);
    expect(config.ids.length).toBe(3);
    expect(config.display.pageSize).toBe(5);
    expect(config.display.progressBarMaxWidth).toBe(DEFAULT_CONFIG.display.progressBarMaxWidth);
  });

  it("applies project settings override", () => {
    const projectDir = join(tempDir, "project");
    mkdirSync(join(projectDir, ".pi"), { recursive: true });
    writeFileSync(
      join(projectDir, ".pi", "settings.json"),
      JSON.stringify({
        "pi-quests": {
          nudges: { toolCallThreshold: 10 },
          validation: { fakeDonePattern: "test" },
        } as Partial<ResolvedConfig>,
      }),
    );
    const ctx = createMockContext(projectDir);
    const config = getConfig(ctx);
    expect(config.nudges.toolCallThreshold).toBe(10);
    expect(config.validation.fakeDonePattern).toBe("test");
    expect(config.ids.length).toBe(DEFAULT_CONFIG.ids.length);
  });

  it("defaults display.showStatus to true and honors a user override", () => {
    const ctxDefault = createMockContext(tempDir);
    expect(getConfig(ctxDefault).display.showStatus).toBe(true);

    writeGlobalSettings({
      "pi-quests": {
        display: { showStatus: false },
      } as Partial<ResolvedConfig>,
    });
    const ctxOverride = createMockContext(tempDir);
    expect(getConfig(ctxOverride).display.showStatus).toBe(false);
  });

  it("defaults nudges.enable to true and honors a user override", () => {
    const ctxDefault = createMockContext(tempDir);
    expect(getConfig(ctxDefault).nudges.enable).toBe(true);

    writeGlobalSettings({
      "pi-quests": {
        nudges: { enable: false },
      } as Partial<ResolvedConfig>,
    });
    const ctxOverride = createMockContext(tempDir);
    expect(getConfig(ctxOverride).nudges.enable).toBe(false);
  });

  it("deep-merges global and project settings", () => {
    const projectDir = join(tempDir, "project2");
    mkdirSync(join(projectDir, ".pi"), { recursive: true });

    writeGlobalSettings({
      "pi-quests": {
        ids: { length: 4 },
        display: { pageSize: 8, progressBarMaxWidth: 20 },
        nudges: {
          toolCallThreshold: 1,
          hintIntervalMinutes: 5,
          complexTaskKeywords: ["alpha", "beta"],
        },
      } as Partial<ResolvedConfig>,
    });

    writeFileSync(
      join(projectDir, ".pi", "settings.json"),
      JSON.stringify({
        "pi-quests": {
          display: { progressBarMaxWidth: 30 },
          nudges: { zeroActiveToolCallThreshold: 7 },
        } as Partial<ResolvedConfig>,
      }),
    );

    const ctx = createMockContext(projectDir);
    const config = getConfig(ctx);

    // Global values preserved where project didn't override
    expect(config.ids.length).toBe(4);
    expect(config.display.pageSize).toBe(8);
    expect(config.nudges.toolCallThreshold).toBe(1);
    expect(config.nudges.hintIntervalMinutes).toBe(5);
    expect(config.nudges.complexTaskKeywords).toEqual(["alpha", "beta"]);

    // Project overrides applied
    expect(config.display.progressBarMaxWidth).toBe(30);
    expect(config.nudges.zeroActiveToolCallThreshold).toBe(7);

    // Defaults preserved where neither set
    expect(config.nudges.timeBasedToolCallThreshold).toBe(
      DEFAULT_CONFIG.nudges.timeBasedToolCallThreshold,
    );
    expect(config.nudges.staleProgressToolCallThreshold).toBe(
      DEFAULT_CONFIG.nudges.staleProgressToolCallThreshold,
    );
  });
});
