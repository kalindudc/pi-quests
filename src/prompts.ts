export const QUEST_PROMPT_REMINDER = [
  "Use the quest tool VERY frequently to track tasks, plans, and progress throughout the conversation.",
  "Before reading files, running commands, or making edits, ensure the current work is tracked as specific, actionable quests.",
  "Do not create a single vague quest for broad requests. Break them into concrete, independent steps.",
  "When the user gives a plan or a list of tasks, add them as quests immediately.",
  "When reading a skill file, implementation plan, or protocol document that contains numbered steps or checklists, add those steps as quests immediately so they are tracked, and reorder them as needed in the quest log.",
  "It is critical that you toggle quests to done as soon as you complete them. Do NOT batch completions.",
  "ALWAYS use the toggle action to mark a quest done. NEVER use the update action to append 'DONE', '- DONE', or any completion marker to a quest description.",
  "ALWAYS use sub-quests to break down a complex quest into smaller steps. To create a sub-quest, use the `add` action and set `parentId` to the parent quest's hex ID. Use sub-quests for multi-step tasks, minion delegations, or when a quest has more than one distinct deliverable.",
  "A parent quest cannot be toggled done until all of its sub-quests are completed. Sub-quests cannot be reordered independently.",
  "Before delegating to a minion, add a quest for the delegated task.",
  "As work evolves, use the reorder action to reflect changes in priority",
  "For reorder, provide the targetId (the hex ID of the quest to insert before).",
  "If you are unsure what to do next, use the list action to check active quests.",
  "Always use the hex ID shown in brackets (e.g. 0a, ff, 44e1, f712a) for toggle, update, delete, and reorder actions.",
] as const;

export const QUEST_PROMPT_GATE =
  "Before reading files, running commands, or making edits, ALWAYS ensure the current work is tracked as specific, actionable quests. ALWAYS break broad requests into concrete steps.";
