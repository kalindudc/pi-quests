import { StringEnum } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";
import { QUEST_ACTION_VALUES } from "../quest/types.js";

export const QuestParams = Type.Object({
  action: StringEnum(QUEST_ACTION_VALUES, {
    description: "The quest action to perform",
  }),
  descriptions: Type.Optional(
    Type.Array(Type.String(), {
      description: "Array of quest descriptions (required for add action)",
    }),
  ),
  description: Type.Optional(
    Type.String({
      description: "New description (required for update action)",
    }),
  ),
  id: Type.Optional(
    Type.Number({
      description: "Quest ID (required for toggle, update, delete actions)",
    }),
  ),
});
