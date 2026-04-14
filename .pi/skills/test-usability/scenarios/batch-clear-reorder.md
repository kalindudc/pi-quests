# Batch Add, Clear, and Reorder

Goal: Verify batch creation of quests and steps, clear semantics, orphan prevention, and top-level reordering with revert.

Precondition: Use fresh quests for this scenario. Clear the log with `all: true` first if needed to reduce noise.

## Steps

1. Use `quest` action `"add"` with `descriptions: ["Batch A", "Batch B", "Batch C"]`.
   - Expected: success mentions `"Added 3 quests"` and listing shows all three in order.
   - Record message and presence check.

2. Add top-level quest `"Batch Parent"` and record ID as `BP_ID`.
   Then use `quest` action `"split"` with `id: BP_ID` and `descriptions: ["Sub A", "Sub B"]`.
   - Expected: both steps appear indented under `"Batch Parent"`.
   - Record message and step count under `BP_ID`.

3. Toggle `"Batch C"` (or any one top-level batch quest) to done, leave the rest undone.
   Then use `quest` action `"clear"` without setting `all`.
   - Expected: only the done quest is removed. `"Batch A"`, `"Batch B"`, `"Batch Parent"`, and its steps remain.
   - Verify by listing and counting survivors (expect 4).
   - Record clear message and survivor count.

4. Use `quest` action `"revert"`.
   - Expected: the cleared quest is restored exactly as before.
   - Verify with `quest list`.
   - Record message and confirmation.

5. Add top-level quest `"Orphan Parent"` and record ID as `OP_ID`.
   Use `quest` action `"split"` with `id: OP_ID` and `descriptions: ["Orphan Step"]` and leave it undone.
   Toggle the orphan step done, then toggle `OP_ID` done.
   Then use `quest` action `"clear"` without `all`.
   - Expected: both the done parent and its done step are removed together. The step must NOT become an invisible orphan.
   - **CRITICAL:** invisible orphans indicate a serious state-management bug.
   - Verify `"Orphan Step"` is absent from the list after clear.

6. Use `quest` action `"clear"` with `all: true`.
   - Expected: all quests and steps removed.
   - Record message and confirmation via listing.

7. Add quests `"Reorder A"`, `"Reorder B"`, `"Reorder C"`.
   Record IDs as `RA_ID`, `RB_ID`, `RC_ID`.
   Use `quest` action `"reorder"` with `id: RC_ID` and `targetId: RA_ID`.
   - Expected: listing shows order as C, A, B.
   - Record message and observed order.

8. Use `quest` action `"revert"`.
   - Expected: original order A, B, C restored.
   - Verify with `quest list`.
   - Record message and confirmed order.

9. Add parent `"P"` and use `quest` action `"split"` with `id: P_ID` and `descriptions: ["S"]` under it. Record IDs.
   Attempt `quest` action `"reorder"` using the step ID as either `id` or `targetId`.
   - Expected: failure mentioning steps are not allowed.
   - Record message.

## Cleanup

Use `quest` action `"clear"` with `all: true` to remove any scenario artifacts.
Confirm list is empty or only contains pre-existing quests.
