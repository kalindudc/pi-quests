import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { getAgentDir } from "@mariozechner/pi-coding-agent";

export interface ResolvedConfig {
  ids: { length: number };
  display: { pageSize: number; progressBarMaxWidth: number };
  nudges: {
    toolCallThreshold: number;
    hintIntervalMinutes: number;
    timeBasedToolCallThreshold: number;
    zeroActiveToolCallThreshold: number;
    staleProgressToolCallThreshold: number;
    stepSuggestionToolCallThreshold: number;
    complexTaskKeywords: string[];
  };
  validation: { fakeDonePattern: string };
  shortcuts?: { openQuests?: string };
}

export const DEFAULT_COMPLEX_TASK_KEYWORDS = [
  "implement",
  "refactor",
  "investigate",
  "review",
  "analyze",
  "audit",
  "plan",
  "design",
  "create",
  "build",
  "write",
  "fix",
] as const;

export const DEFAULT_FAKE_DONE_PATTERN = String.raw`\s[-\u2013\u2014]\s*(DONE|COMPLETED|FINISHED)$|\s[([](DONE|COMPLETED|FINISHED)[)\]]$`;

export const DEFAULT_CONFIG: ResolvedConfig = {
  ids: { length: 2 },
  display: { pageSize: 10, progressBarMaxWidth: 24 },
  nudges: {
    toolCallThreshold: 8,
    hintIntervalMinutes: 4,
    timeBasedToolCallThreshold: 5,
    zeroActiveToolCallThreshold: 8,
    staleProgressToolCallThreshold: 16,
    stepSuggestionToolCallThreshold: 10,
    complexTaskKeywords: [...DEFAULT_COMPLEX_TASK_KEYWORDS],
  },
  validation: { fakeDonePattern: DEFAULT_FAKE_DONE_PATTERN },
  shortcuts: {},
};

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function loadSettings(cwd: string): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  const globalPath = join(getAgentDir(), "settings.json");
  if (existsSync(globalPath)) {
    try {
      Object.assign(settings, JSON.parse(readFileSync(globalPath, "utf-8")));
    } catch {
      /* ignore */
    }
  }
  const projectPath = join(cwd, ".pi", "settings.json");
  if (existsSync(projectPath)) {
    try {
      const project = JSON.parse(readFileSync(projectPath, "utf-8")) as Record<string, unknown>;
      if (project["pi-quests"] && typeof project["pi-quests"] === "object") {
        const globalPiQuests =
          settings["pi-quests"] && typeof settings["pi-quests"] === "object"
            ? (settings["pi-quests"] as Record<string, unknown>)
            : {};
        settings["pi-quests"] = deepMerge(
          globalPiQuests,
          project["pi-quests"] as Record<string, unknown>,
        );
      }
    } catch {
      /* ignore */
    }
  }
  return settings;
}

export function getConfig(ctx: Pick<ExtensionContext, "cwd">): ResolvedConfig {
  const settings = loadSettings(ctx.cwd);
  const user = (settings["pi-quests"] ?? {}) as Partial<ResolvedConfig>;
  return {
    ids: { length: user.ids?.length ?? DEFAULT_CONFIG.ids.length },
    display: {
      pageSize: user.display?.pageSize ?? DEFAULT_CONFIG.display.pageSize,
      progressBarMaxWidth:
        user.display?.progressBarMaxWidth ?? DEFAULT_CONFIG.display.progressBarMaxWidth,
    },
    nudges: {
      toolCallThreshold: user.nudges?.toolCallThreshold ?? DEFAULT_CONFIG.nudges.toolCallThreshold,
      hintIntervalMinutes:
        user.nudges?.hintIntervalMinutes ?? DEFAULT_CONFIG.nudges.hintIntervalMinutes,
      timeBasedToolCallThreshold:
        user.nudges?.timeBasedToolCallThreshold ?? DEFAULT_CONFIG.nudges.timeBasedToolCallThreshold,
      zeroActiveToolCallThreshold:
        user.nudges?.zeroActiveToolCallThreshold ??
        DEFAULT_CONFIG.nudges.zeroActiveToolCallThreshold,
      staleProgressToolCallThreshold:
        user.nudges?.staleProgressToolCallThreshold ??
        DEFAULT_CONFIG.nudges.staleProgressToolCallThreshold,
      stepSuggestionToolCallThreshold:
        user.nudges?.stepSuggestionToolCallThreshold ??
        DEFAULT_CONFIG.nudges.stepSuggestionToolCallThreshold,
      complexTaskKeywords: [
        ...(user.nudges?.complexTaskKeywords ?? DEFAULT_CONFIG.nudges.complexTaskKeywords),
      ],
    },
    validation: {
      fakeDonePattern:
        user.validation?.fakeDonePattern ?? DEFAULT_CONFIG.validation.fakeDonePattern,
    },
    shortcuts: {
      openQuests: user.shortcuts?.openQuests,
    },
  };
}
