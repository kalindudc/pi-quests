# Batch Add, Clear, and Reorder

Goal: Verify batch creation of quests and subquests, clear semantics, orphan prevention, and top-level reordering with revert.

Precondition: Use fresh quests for this scenario. Clear the log with `all: true` first if needed to reduce noise.

## Steps

1. Use `quest` action `"add"` with `descriptions: ["Batch A", "Batch B", "Batch C"]`.
   - Expected: success mentions `"Added 3 quests"` and listing shows all three in order.
   - Record message and presence check.

2. Add top-level quest `"Batch Parent"` and record ID as `BP_ID`.
   Then use `quest` action `"add"` with `descriptions: ["Sub A", "Sub B"]` and `parentId: BP_ID`.
   - Expected: both subquests appear indented under `"Batch Parent"`.
   - Record message and subquest count under `BP_ID`.

3. Toggle `"Batch C"` (or any one top-level batch quest) to done, leave the rest undone.
   Then use `quest` action `"clear"` without setting `all`.
   - Expected: only the done quest is removed. `"Batch A"`, `"Batch B"`, `"Batch Parent"`, and its subquests remain.
   - Verify by listing and counting survivors (expect 4).
   - Record clear message and survivor count.

4. Use `quest` action `"revert"`.
   - Expected: the cleared quest is restored exactly as before.
   - Verify with `quest list`.
   - Record message and confirmation.

5. Add top-level quest `"Orphan Parent"` and record ID as `OP_ID`.
   Add subquest `"Orphan Sub"` under `OP_ID` and leave it undone.
   Toggle `OP_ID` done.
   Then use `quest` action `"clear"` without `all`.
   - Expected: the incomplete subquest must NOT become an invisible orphan.
   - **CRITICAL:** invisible orphans indicate a serious state-management bug.
   - Record presence or absence of `"Orphan Sub"` in the list after clear.

6. Use `quest` action `"clear"` with `all: true`.
   - Expected: all quests and subquests removed.
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

9. Add parent `"P"` and subquest `"S"` under it. Record IDs.
   Attempt `quest` action `"reorder"` using the subquest ID as either `id` or `targetId`.
   - Expected: failure mentioning subquests are not allowed.
   - Record message.

## Cleanup

Use `quest` action `"clear"` with `all: true` to remove any scenario artifacts.
Confirm list is empty or only contains pre-existing quests.
