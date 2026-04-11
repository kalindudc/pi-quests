import { StringEnum } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";
import { QUEST_ACTION_VALUES } from "../quest/types.js";

export const QuestParams = Type.Object({
  action: StringEnum(QUEST_ACTION_VALUES),
  description: Type.Optional(Type.String()),
  descriptions: Type.Optional(Type.Array(Type.String())),
  id: Type.Optional(Type.Number()),
});
