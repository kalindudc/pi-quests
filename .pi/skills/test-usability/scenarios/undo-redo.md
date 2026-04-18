# Undo/Redo Chain for Steps, Deletes, and Updates

Goal: Verify undo and redo correctly restore and replay mutations, with redo stack reset on new mutations.
Precondition: Session quest log may have existing items. Create test quests and clean them up.

## Steps

1. Add top-level quest "UndoRedo Parent" and record ID as PARENT_ID.
   Split into steps: ["Step A", "Step B"], record IDs as SA_ID and SB_ID.
   - Verify list shows parent with two steps.

2. Toggle SA_ID done. Then undo.
   - Expected: SA_ID returns to undone, message contains "Reverted toggle".
   - Redo.
   - Expected: SA_ID is done again, message contains "Redone toggle".
   - Record messages and observed done states.

3. Delete PARENT_ID (toggle steps done first if needed).
   - Verify list shows none remain.
   - Undo.
   - Expected: parent and both steps restored.
   - Redo.
   - Expected: parent and steps removed again.
   - Record messages and counts.

4. Update PARENT_ID description to "UndoRedo Parent Updated".
   - Undo. Verify description is restored.
   - Redo. Verify description is updated again.

5. Add a new quest "Interrupter". Then try to redo the earlier update undo.
   - Expected: nothing to redo (redo stack cleared by new mutation).
   - Verify error message contains "Nothing to redo".

6. Undo three times in sequence: removes "Interrupter", restores PARENT_ID description, toggles SA_ID undone.
   - Verify each step message and final list state.

## Cleanup

Delete PARENT_ID if it exists. Verify no scenario artifacts remain.
