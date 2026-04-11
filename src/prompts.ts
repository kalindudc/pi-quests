export const QUEST_PROMPT_REMINDER = [
  "Use the quest tool VERY frequently to track tasks, plans, and progress throughout the conversation.",
  "Before reading files, running commands, or making edits, ensure the current work is tracked as specific, actionable quests.",
  "Do not create a single vague quest for broad requests. Break them into concrete, independent steps.",
  "When the user gives a plan or a list of tasks, add them as quests immediately.",
  "When reading a skill file, implementation plan, or protocol document that contains numbered steps or checklists, add those steps as quests immediately so they are tracked, and reorder them as needed in the quest log.",
  "It is critical that you toggle quests to done as soon as you complete them. Do NOT batch completions.",
  "ALWAYS use the toggle action to mark a quest done. NEVER use the update action to append 'DONE', '- DONE', or any completion marker to a quest description.",
  "As work evolves, use the reorder action to reflect changes in priority or sequencing.",
  "Before delegating to a minion, add a quest for the delegated task.",
  "For reorder, targetIndex is 0-based (array index), not a 1-based position. If the user says 'move quest to position 5', use targetIndex 4.",
  "If you are unsure what to do next, use the list action to check active quests.",
] as const;

export const QUEST_PROMPT_GATE =
  "Before reading files, running commands, or making edits, ALWAYS ensure the current work is tracked as specific, actionable quests. ALWAYS break broad requests into concrete steps.";
