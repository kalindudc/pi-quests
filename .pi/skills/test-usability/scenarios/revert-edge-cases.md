# Revert Edge Cases for Steps

Goal: Verify revert correctly undoes step additions, step toggles, and parent deletions including cascaded steps. Detect silent failures and data loss.

Precondition: Create a fresh parent with steps for this scenario. Do not rely on state from previous scenarios.

## Steps

1. Add top-level quest `"Revert Parent"` and record its ID as `RP_ID`.
   Use `quest` action `"split"` with `id: RP_ID` and `descriptions: ["Revert Step 1"]` and record as `RS1_ID`.
   Use `quest` action `"split"` with `id: RP_ID` and `descriptions: ["Revert Step 2"]` and record as `RS2_ID`.
   - Verify `quest list` shows three items under the parent.

2. Use `quest` action `"split"` with `id: RP_ID` and `descriptions: ["Step to revert"]`.
   - Verify `quest list` confirms it is present and step count under `RP_ID` is 3.
   - Use `quest` action `"revert"`.
   - Expected: success message and `"Step to revert"` is removed.
   - Verify list count under `RP_ID` is exactly 2.
   - **CRITICAL:** if the success message appears but count stays 3, the revert handler is broken.
   - Record revert message and counts before/after.

3. Toggle `RS2_ID` done.
   - Use `quest` action `"revert"`.
   - Expected: `RS2_ID` returns to undone and message reads `Reverted toggle for quest [RS2_ID]`.
   - Verify list shows `[ ]` next to `"Revert Step 2"`.
   - **CRITICAL:** returning `Quest [RS2_ID] not found` means the revert toggle handler ignores `steps`.
   - Record message and observed done state after revert.

4. Toggle `RS1_ID` done, `RS2_ID` done if not already, and `RP_ID` done.
   - Verify `quest list` confirms all three are `[x]`.

5. Delete `RP_ID`.
   - Expected: parent and all steps removed together.
   - Verify `quest list` shows none remain.
   - Record message and remaining quest count.

6. Use `quest` action `"revert"`.
   - Expected: parent AND both steps are restored.
   - Verify `quest list` shows `"Revert Parent"` with both steps indented beneath it.
   - **CRITICAL:** if only the parent returns and steps are missing, data loss occurred because cascade-deleted steps were not tracked in history.
   - Record revert message and restored item count.

7. Toggle `RP_ID` undone.
   Update `RS1_ID` description to `"Updated RS1"`.
   Use `quest` action `"split"` with `id: RP_ID` and `descriptions: ["Chain step"]`. 
   - Verify `quest list` confirms these three mutations.
   - Revert three times in sequence.
   - Expected: first revert removes `"Chain sub"`, second restores `RS1` description to `"Revert Sub 1"`, third toggles `RP_ID` back to done.
   - Record each revert result and whether final list matches expectations.

## Cleanup

Delete `RP_ID` (toggle steps done first if needed). Verify no scenario artifacts remain in the list.
