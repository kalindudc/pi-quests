# AGENTS

pi-quests is a pi-coding-agent extension that adds a session-scoped quest log with one LLM tool (`quest`) and one command namespace (`/quests`).

## Module map

| Module | Purpose |
|--------|---------|
| `src/index.ts` | Entry point — registers tools, commands, renderers, session hooks |
| `src/quest/types.ts` | `Quest`, `QUEST_ACTIONS`, and action value constants |
| `src/quest/formatters.ts` | Pure string formatting for all quest results |
| `src/quest/dataplane.ts` | `QuestLog` — state, history, `execute()`, revert, session reconstruction |
| `src/tools/params.ts` | `quest` tool Typebox parameter schema |
| `src/tools/handler.ts` | `quest` tool implementation (`questToolExecute`, `registerQuestTool`) |
| `src/commands/parse-args.ts` | `/quests` argument tokenizer and parser |
| `src/commands/changelog.ts` | `reverseChangelog` helper |
| `src/commands/handler.ts` | `/quests` command dispatcher |
| `src/renderers/*.ts` | TUI renderers for tools, commands, and changelogs |
| `src/logger.ts` | Namespaced debug logging |

## Development

This project uses **npm** scripts. If **pnpm** is available, it can be used as a drop-in replacement (e.g. `pnpm run typecheck` instead of `npm run typecheck`).

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npx vitest run --reporter=json` | Run unit tests (vitest) |
| `npm run style` | Lint and format check (biome) |
| `npm run style:fix` | Auto-fix biome issues |

## Debugging

Debug logs can be found in `tmp/logs/`. If this directory does not exist run `npm run prepare` to bootstrap.

## Writing tests

- Tests live in `test/` mirroring the `src/` structure.
- Maintain three tiers:
  1. **Domain unit tests** (`test/quest/*.test.ts`) — fast feedback on state mutations and pure functions.
  2. **Adapter unit tests** (`test/commands/*.test.ts`, `test/tools/*.test.ts`) — mock the dataplane and verify framework-specific adaptation.
  3. **Behavior tests** (`test/behavior.test.ts`) — end-to-end flows through adapter → dataplane → formatter to catch integration drift.
- Prefer directly importing and exercising the unit under test rather than going through higher-level indirection.
- Mock external dependencies narrowly and keep assertions focused on observable outcomes.
- Run the full test suite after behaviour changes; run targeted tests for fast feedback during iteration.

## Definition of done

A change is complete when ALL of the following pass:
1. `npm run typecheck` exits 0
2. `npx vitest run --reporter=json` exits 0 with no failures
3. `npm run style` exits 0
4. Open tests were run after the last code change

## Key conventions

- TypeScript strict (`tsc --noEmit` must pass)
- vitest for unit tests
- Keep documentation concise; one concept per file in `docs/`
- Do not duplicate content across docs — link instead
- Renderers live in `src/renderers/`, tools in `src/tools/`, commands in `src/commands/`

## Rules

- NEVER Edit `node_modules/` or generated files
- NEVER Skip tests after behavior changes
- NEVER Duplicate documentation across `docs/` files
- NEVER add any inline imports, ALWAYS import types and classes properly if they are being used
