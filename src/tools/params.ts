import { StringEnum } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";
import { QUEST_ACTION_VALUES } from "../quest/types.js";

export function createQuestParams(idLength: number) {
  const pattern = `^[0-9a-f]{${idLength}}$`;
  return Type.Object({
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
        pattern,
        description: `Quest ID (required for toggle, update, delete, reorder actions). ALWAYS use the ${idLength}-digit hex ID shown in brackets, never the positional number.`,
      }),
    ),
    targetId: Type.Optional(
      Type.String({
        pattern,
        description:
          "Target quest ID for reorder action. The quest will be moved to just before the target quest.",
      }),
    ),
    parentId: Type.Optional(
      Type.String({
        pattern,
        description: "Parent quest ID for reparent action. Omit to promote to top-level.",
      }),
    ),
    all: Type.Optional(
      Type.Boolean({
        description: "Clear all quests when true (defaults to clearing only completed quests)",
      }),
    ),
  });
}

export type QuestParamsType = ReturnType<typeof createQuestParams>;
