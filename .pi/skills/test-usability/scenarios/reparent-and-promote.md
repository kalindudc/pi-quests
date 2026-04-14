# Reparent, Promote, and Demote

Goal: Verify the `reparent` action promotes steps to top-level quests, demotes quests to steps, moves steps between parents, validates constraints, and reverts correctly.

Precondition: Session quest log may have existing items. This scenario creates test quests and cleans them up.

## Steps

1. Use `quest` tool with `action: "add"` and `descriptions: ["Reparent Parent A"]`.
   - Expected: success message with an assigned ID.
   - Record the ID as `PA_ID`.

2. Use `quest` tool with `action: "add"` and `descriptions: ["Reparent Parent B"]`.
   - Expected: success message with an assigned ID.
   - Record the ID as `PB_ID`.

3. Use `quest` tool with `action: "split"`, `id: PA_ID`, and `descriptions: ["Promote Me"]`.
   - Expected: success with step ID.
   - Record as `STEP_ID`.
   - Verify `quest list` shows the step indented under `PA_ID`.

4. Use `quest` tool with `action: "reparent"` and `id: STEP_ID` (omit `parentId`).
   - Expected: success message containing `Promoted quest [STEP_ID] to top-level`.
   - Verify `quest list` shows `Promote Me` as a top-level quest and no longer indented under `PA_ID`.

5. Use `quest` tool with `action: "reparent"`, `id: STEP_ID`, and `parentId: PB_ID`.
   - Expected: success message containing `Moved quest [STEP_ID] under [PB_ID]`.
   - Verify `quest list` shows `Promote Me` indented under `PB_ID`.

6. Use `quest` tool with `action: "revert"`.
   - Expected: revert message mentioning `Reverted reparent for quest [STEP_ID]`.
   - Verify `quest list` shows `Promote Me` back as a top-level quest (reverting the move to `PB_ID`).

7. Use `quest` tool with `action: "revert"`.
   - Expected: revert message mentioning `Reverted reparent for quest [STEP_ID]`.
   - Verify `quest list` shows `Promote Me` indented under `PA_ID` again (reverting the promotion).

8. Use `quest` tool with `action: "add"` and `descriptions: ["Demote Me"]`.
   - Expected: success with ID.
   - Record as `DEMOTE_ID`.
   - Use `quest` tool with `action: "reparent"`, `id: DEMOTE_ID`, and `parentId: PA_ID`.
   - Expected: success message containing `Moved quest [DEMOTE_ID] under [PA_ID]`.
   - Verify `quest list` shows `Demote Me` indented under `PA_ID`.

9. Use `quest` tool with `action: "reparent"`, `id: DEMOTE_ID`, and `parentId: DEMOTE_ID`.
   - Expected: **failure** with a message saying a quest cannot be its own parent.
   - Record verbatim message.

10. Use `quest` tool with `action: "reparent"`, `id: DEMOTE_ID`, and `parentId: "zz"`.
    - Expected: **failure** with a clear "not found" or invalid target message.
    - Record verbatim message.

11. Use `quest` tool with `action: "reparent"`, `id: DEMOTE_ID`, and `parentId: STEP_ID`.
    - Expected: **failure** clearly saying a step cannot be a parent, NOT a generic "not found".
    - **CRITICAL:** "not found" here means the step-parent guard is missing.
    - Record verbatim message.

12. Toggle `PA_ID` done.
    Use `quest` tool with `action: "reparent"`, `id: DEMOTE_ID`, and `parentId: PA_ID`.
    - Expected: **failure** saying the parent is done and steps can only be added to open parents.
    - Record verbatim message.

13. Toggle `PA_ID` undone.
    Use `quest` tool with `action: "split"`, `id: DEMOTE_ID` (now a step under `PA_ID`), and `descriptions: ["Nested guard"]`.
    - Wait, `DEMOTE_ID` is a step — instead add a fresh top-level quest `"Has Steps"`, split it into a step, then try to demote it.
    - Add top-level quest `"Has Steps"` and record as `HS_ID`.
    - Use `quest` tool with `action: "split"`, `id: HS_ID`, and `descriptions: ["Child step"]`.
    - Use `quest` tool with `action: "reparent"`, `id: HS_ID`, and `parentId: PA_ID`.
    - Expected: **failure** saying the quest has steps and cannot be demoted.
    - Record verbatim message.

## Cleanup

Delete `PA_ID` (toggle any incomplete steps done first if needed). Delete `PB_ID` and `HS_ID` if they still exist. Verify no scenario artifacts remain in the list.
