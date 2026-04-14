# Rules and Skill Document

Goal: Verify the `rules` and `skill` tool actions return the quest-management skill document without mutating the quest log.

Precondition: Session quest log may have existing items. These actions are read-only and should not modify state.

## Steps

1. Use `quest` tool with `action: "rules"`.
   - Expected: success message containing the skill document text with `name: quest-management`.
   - Verify the message includes `# Quest Management`.
   - Record confirmation that no quest IDs were created or removed.

2. Use `quest` tool with `action: "skill"`.
   - Expected: success message containing the same skill document text as `rules`.
   - Verify the message includes `name: quest-management`.
   - **CRITICAL:** if `skill` is rejected as an unknown action, the alias is broken.
   - Record confirmation that the content matches the `rules` output.

3. Use `quest` tool with `action: "list"`.
   - Expected: quest log state is unchanged from before steps 1–2.
   - Verify no new quests appeared and no existing quests were modified.

## Cleanup

No cleanup required. These actions do not mutate the quest log. Verify the list is unchanged.
