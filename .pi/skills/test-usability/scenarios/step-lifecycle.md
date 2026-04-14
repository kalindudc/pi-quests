# Step Lifecycle and Blocking Rules

Goal: Verify steps are created under parents via split, parents are blocked from toggle/delete when steps are incomplete, and step updates work.

Precondition: Any quest log state is fine. This scenario creates its own parent and steps.

## Steps

1. Use `quest` tool with `action: "add"` and `descriptions: ["Parent probe"]`.
   - Expected: success with assigned ID.
   - Record the ID as `PARENT_ID`.

2. Use `quest` tool with `action: "split"`, `id: PARENT_ID`, and `descriptions: ["Sub probe 1"]`.
   - Expected: success with step ID.
   - Record as `STEP1_ID`.

3. Use `quest` tool with `action: "split"`, `id: PARENT_ID`, and `descriptions: ["Sub probe 2"]`.
   - Expected: success with step ID.
   - Record as `STEP2_ID`.

4. Use `quest` tool with `action: "list"`.
   - Expected: parent has a positional number like `#N`, steps are indented below without numbers.

5. Use `quest` tool with `action: "toggle"` and `id: PARENT_ID` (both steps should be undone).
   - Expected: **failure** with a message explicitly saying the parent has incomplete steps.
   - **CRITICAL:** a generic `Quest [id] not found` instead of a step-blocking message is a severe usability bug.

6. Use `quest` tool with `action: "delete"` and `id: PARENT_ID`.
   - Expected: **failure** with a clear step-blocking message, NOT "not found".
   - **CRITICAL:** "not found" here is unacceptable.

7. Toggle `STEP1_ID` done, then toggle `STEP2_ID` done.
   - Expected: each returns a done message. Listing shows both `[x]`.

8. Toggle `PARENT_ID`.
   - Expected: parent toggles successfully to done.

9. Update `STEP1_ID` with `description: "Sub probe 1 updated"`.
   - Expected: success and listing reflects new description.
   - **CRITICAL:** returning `Quest [STEP1_ID] not found` means step updates are broken.

10. Use `quest` tool with `action: "split"`, `id: STEP1_ID`, and `descriptions: ["Nested step"]`.
    - Expected: failure indicating steps cannot have nested steps (or similar), not a generic "not found".

## Cleanup

Delete `PARENT_ID`. If deletion is blocked, toggle all steps done first, then delete the parent (which cascades). Verify the list is clean of scenario artifacts.
