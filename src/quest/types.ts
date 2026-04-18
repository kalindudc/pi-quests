/**
 * Core domain types and action constants for the quest system.
 */

export const QUEST_ACTIONS = {
  add: "add",
  list: "list",
  toggle: "toggle",
  update: "update",
  delete: "delete",
  clear: "clear",
  reorder: "reorder",
  undo: "undo",
  redo: "redo",
  reparent: "reparent",
  rules: "rules",
  skill: "skill",
  split: "split",
  add_step: "add_step",
} as const;

export const QUEST_ACTION_VALUES = [
  QUEST_ACTIONS.add,
  QUEST_ACTIONS.list,
  QUEST_ACTIONS.toggle,
  QUEST_ACTIONS.update,
  QUEST_ACTIONS.delete,
  QUEST_ACTIONS.clear,
  QUEST_ACTIONS.reorder,
  QUEST_ACTIONS.undo,
  QUEST_ACTIONS.redo,
  QUEST_ACTIONS.reparent,
  QUEST_ACTIONS.rules,
  QUEST_ACTIONS.skill,
  QUEST_ACTIONS.split,
  QUEST_ACTIONS.add_step,
] as const;

export type QuestActionType = (typeof QUEST_ACTION_VALUES)[number];

export interface Quest {
  id: string;
  description: string;
  done: boolean;
  createdAt: number;
}

export interface Step extends Quest {
  parentId: string;
}
