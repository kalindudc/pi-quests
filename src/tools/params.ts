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
    Type.String({
      pattern: "^[0-9a-f]{2}$",
      description:
        "Quest ID (required for toggle, update, delete, reorder actions). ALWAYS use the 2-digit hex ID shown in brackets (e.g. 0a, ff), never the positional number.",
    }),
  ),
  targetId: Type.Optional(
    Type.String({
      pattern: "^[0-9a-f]{2}$",
      description:
        "Target quest ID for reorder action. The quest will be moved to just before the target quest.",
    }),
  ),
  all: Type.Optional(
    Type.Boolean({
      description: "Clear all quests when true (defaults to clearing only completed quests)",
    }),
  ),
});
