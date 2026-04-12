import { describe, expect, it } from "vitest";
import { QUEST_ACTION_VALUES } from "../../src/quest/types.js";
import { createQuestParams } from "../../src/tools/params.js";

describe("QuestParams", () => {
  it("action enum matches QUEST_ACTION_VALUES", () => {
    const params = createQuestParams(2);
    const actionSchema = params.properties.action as { enum?: string[] };
    expect(actionSchema.enum).toEqual(QUEST_ACTION_VALUES);
  });
});
