# Basic Quest CRUD and Revert Chain

Goal: Verify top-level quests can be created, toggled, updated, deleted, and restored via revert without silent failures.

Precondition: Session quest log may have existing items. This scenario creates test quests and cleans them up.

## Steps

1. Use `quest` tool with `action: "add"` and `descriptions: ["Usability alpha"]`.
   - Expected: success message with an assigned ID.
   - Record the ID as `ALPHA_ID`.

2. Use `quest` tool with `action: "toggle"` and `id: ALPHA_ID`.
   - Expected: `Quest [xx] done`.

3. Use `quest` tool with `action: "toggle"` and `id: ALPHA_ID`.
   - Expected: `Quest [xx] undone`.

4. Use `quest` tool with `action: "update"`, `id: ALPHA_ID`, and `description: "Usability alpha updated"`.
   - Expected: success confirming the new description.

5. Use `quest` tool with `action: "revert"`.
   - Expected: message indicates update was reverted.
   - Verify by listing quests that the description is back to `Usability alpha`.

6. Use `quest` tool with `action: "delete"` and `id: ALPHA_ID`.
   - Expected: success message.

7. Use `quest` tool with `action: "revert"`.
   - Expected: delete reverted and quest reappears in list.
   - Verify with `quest list`.

8. Use `quest` tool with `action: "revert"`.
   - Expected: restored quest is toggled back to done (reverting the earlier toggle-to-undone).
   - Verify with `quest list` if needed.

9. Use `quest` tool with `action: "add"` and `descriptions: ["Beta"]`.
   Then use `quest` tool with `action: "revert"`.
   - Expected: Beta is removed entirely.
   - Verify with `quest list`.

## Cleanup

If `ALPHA_ID` still exists and was not cleaned up by the revert chain, delete it with `quest delete ALPHA_ID`. Verify the list no longer contains test quests from this scenario.
