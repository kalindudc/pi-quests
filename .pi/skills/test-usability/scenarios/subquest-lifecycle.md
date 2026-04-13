# Subquest Lifecycle and Blocking Rules

Goal: Verify subquests are created under parents, parents are blocked from toggle/delete when subquests are incomplete, and subquest updates work.

Precondition: Any quest log state is fine. This scenario creates its own parent and subquests.

## Steps

1. Use `quest` tool with `action: "add"` and `descriptions: ["Parent probe"]`.
   - Expected: success with assigned ID.
   - Record the ID as `PARENT_ID`.

2. Use `quest` tool with `action: "add"`, `descriptions: ["Sub probe 1"]`, and `parentId: PARENT_ID`.
   - Expected: success with subquest ID.
   - Record as `SUB1_ID`.

3. Use `quest` tool with `action: "add"`, `descriptions: ["Sub probe 2"]`, and `parentId: PARENT_ID`.
   - Expected: success with subquest ID.
   - Record as `SUB2_ID`.

4. Use `quest` tool with `action: "list"`.
   - Expected: parent has a positional number like `#N`, subquests are indented below without numbers.

5. Use `quest` tool with `action: "toggle"` and `id: PARENT_ID` (both subquests should be undone).
   - Expected: **failure** with a message explicitly saying the parent has incomplete subquests.
   - **CRITICAL:** a generic `Quest [id] not found` instead of a subquest-blocking message is a severe usability bug.

6. Use `quest` tool with `action: "delete"` and `id: PARENT_ID`.
   - Expected: **failure** with a clear subquest-blocking message, NOT "not found".
   - **CRITICAL:** "not found" here is unacceptable.

7. Toggle `SUB1_ID` done, then toggle `SUB2_ID` done.
   - Expected: each returns a done message. Listing shows both `[x]`.

8. Toggle `PARENT_ID`.
   - Expected: parent toggles successfully to done.

9. Update `SUB1_ID` with `description: "Sub probe 1 updated"`.
   - Expected: success and listing reflects new description.
   - **CRITICAL:** returning `Quest [SUB1_ID] not found` means subquest updates are broken.

10. Try to add a subquest with `parentId: SUB1_ID` and `descriptions: ["Nested sub"]`.
    - Expected: failure indicating subquests cannot be parents (or similar), not a generic "not found".

## Cleanup

Delete `PARENT_ID`. If deletion is blocked, toggle all subquests done first, then delete the parent (which cascades). Verify the list is clean of scenario artifacts.
