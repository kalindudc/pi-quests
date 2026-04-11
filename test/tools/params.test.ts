import { describe, expect, it } from "vitest";
import { QUEST_ACTION_VALUES } from "../../src/quest/types.js";
import { QuestParams } from "../../src/tools/params.js";

describe("QuestParams", () => {
  it("action enum matches QUEST_ACTION_VALUES", () => {
    const actionSchema = QuestParams.properties.action as { enum?: string[] };
    expect(actionSchema.enum).toEqual(QUEST_ACTION_VALUES);
  });
});
