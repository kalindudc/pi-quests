# Command Parser Edge Cases

Goal: Verify the `/quests` CLI parser handles `--parent` correctly, rejects malformed inputs with helpful messages, and does not crash.

Precondition: At least one top-level quest must exist to serve as a valid parent. If none exist, create one with `/quests add "CLI Parent"` before proceeding.

## Steps

1. Identify a valid parent with `/quests list` or `quest list`.
   - Record any top-level quest ID as `CLI_PARENT_ID`.

2. Run `/quests add --parent CLI_PARENT_ID "CLI sub"`.
   - Expected: subquest created under the specified parent and listing shows it indented.
   - Record status and response message.

3. Run `/quests add --parent CLI_PARENT_ID` with no trailing description.
   - Expected: error showing correct usage.
   - Record verbatim message.

4. Run `/quests add --parent xyz "desc"` where `xyz` is not a valid hex ID.
   - Expected: error about invalid ID format or usage hint.
   - Record verbatim message.

5. Run `/quests toggle` with no ID.
   - Expected: usage error.
   - Record verbatim message.

6. Run `/quests delete zz`.
   - Expected: error about invalid ID format.
   - Record verbatim message.

7. Run `/quests reorder aa` with only one ID.
   - Expected: usage error indicating both `id` and `targetId` are required.
   - Record verbatim message.

8. Run `/quests foobar`.
   - Expected: friendly error suggesting `/quests help`.
   - Record verbatim message.

## Cleanup

Delete any quests created for this scenario including the CLI subquest from step 2.
Confirm the list is clean of test artifacts.
