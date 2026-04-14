# Split and Add-Step Alias Behavior

Goal: Verify the `split` action and `add_step` / `add-step` aliases work correctly, reject invalid inputs with clear errors, and produce the same results.

Precondition: Create a fresh top-level quest to serve as a parent. If none exist, add one with `quest add "Split Parent"` first.

## Steps

1. Add top-level quest `"Split Parent"` and record its ID as `SP_ID`.

2. Use `quest` tool with `action: "split"`, `id: SP_ID`, and `descriptions: ["Step A", "Step B"]`.
   - Expected: success message mentioning `"Split quest [SP_ID] into 2 steps"`.
   - Verify `quest list` shows both steps indented under `"Split Parent"`.
   - Record message and observed step count.

3. Use `quest` tool with `action: "add_step"`, `id: SP_ID`, and `descriptions: ["Step C"]`.
   - Expected: same success behavior as `split` — `"Step C"` appears indented under `"Split Parent"`.
   - **CRITICAL:** if `add_step` is rejected as an unknown action, the alias is broken.
   - Record message and confirm total steps under `SP_ID` is 3.

4. Run `/quests add-step SP_ID "CLI step"`.
   - Expected: step created under `"Split Parent"` via the command alias.
   - Verify `quest list` shows the new step.
   - Record message.

5. Use `quest` tool with `action: "split"` and no `id`.
   - Expected: error indicating an id is required.
   - Record verbatim message.

6. Use `quest` tool with `action: "split"`, `id: SP_ID`, but no `descriptions`.
   - Expected: error indicating at least one description is required.
   - Record verbatim message.

7. Use `quest` tool with `action: "split"`, `id: SP_ID`, and `descriptions: [""]`.
   - Expected: error indicating descriptions must be non-empty.
   - Record verbatim message.

8. Use `quest` tool with `action: "split"`, `id: "ff"`, and `descriptions: ["Ghost step"]`.
   - Expected: error indicating the quest was not found.
   - Record verbatim message.

9. Identify any one step ID under `SP_ID` (call it `NESTED_ID`).
   Use `quest` tool with `action: "split"`, `id: NESTED_ID`, and `descriptions: ["Nested attempt"]`.
   - Expected: failure clearly saying steps cannot have nested steps, NOT a generic "not found".
   - **CRITICAL:** "not found" here means the nesting guard is missing.
   - Record message.

## Cleanup

Delete `SP_ID` (toggle any incomplete steps done first if needed). Verify no scenario artifacts remain in the list.
