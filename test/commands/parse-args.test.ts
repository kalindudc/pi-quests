import { describe, expect, it } from "vitest";
import { parseQuestArgs } from "../../src/commands/parse-args.js";
import { QUEST_ACTIONS } from "../../src/quest/types.js";

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
    expect(parseQuestArgs("list")).toEqual({ action: QUEST_ACTIONS.list });
  });

  it("parses clear", () => {
    expect(parseQuestArgs("clear")).toEqual({ action: QUEST_ACTIONS.clear });
  });

  it("parses add with description", () => {
    expect(parseQuestArgs("add Buy milk")).toEqual({
      action: QUEST_ACTIONS.add,
      description: "Buy milk",
    });
  });

  it("returns error for add without description", () => {
    expect(parseQuestArgs("add")).toEqual({ error: "Usage: /quests add <description>" });
  });

  it("parses toggle with id", () => {
    expect(parseQuestArgs("toggle 3")).toEqual({ action: QUEST_ACTIONS.toggle, id: 3 });
  });

  it("returns error for toggle without id", () => {
    expect(parseQuestArgs("toggle")).toEqual({ error: "Usage: /quests toggle <id>" });
  });

  it("returns error for toggle with invalid id", () => {
    expect(parseQuestArgs("toggle abc")).toEqual({ error: "Usage: /quests toggle <id>" });
  });

  it("parses revert", () => {
    expect(parseQuestArgs("revert")).toEqual({ action: QUEST_ACTIONS.revert });
  });

  it("parses update with id and description", () => {
    expect(parseQuestArgs("update 3 New desc")).toEqual({
      action: QUEST_ACTIONS.update,
      id: 3,
      description: "New desc",
    });
  });

  it("returns error for update without id", () => {
    expect(parseQuestArgs("update")).toEqual({
      error: "Usage: /quests update <id> <description>",
    });
  });

  it("returns error for update without description", () => {
    expect(parseQuestArgs("update 1")).toEqual({
      error: "Usage: /quests update <id> <description>",
    });
  });

  it("parses delete with id", () => {
    expect(parseQuestArgs("delete 3")).toEqual({ action: QUEST_ACTIONS.delete, id: 3 });
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
    expect(parseQuestArgs("")).toEqual({ action: QUEST_ACTIONS.list });
  });
});
