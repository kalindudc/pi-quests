# AGENTS

pi-quests is a pi-coding-agent extension that adds a session-scoped quest log with one LLM tool (`quest`) and one command namespace (`/quests`).

## Module map

| Module | Purpose |
|--------|---------|
| `src/index.ts` | Entry point — registers tools, commands, renderers, session hooks |
| `src/quests.ts` | `QuestLog` — state, history, revert, session reconstruction |
| `src/tools/quest.ts` | `quest` tool implementation |
| `src/commands/quests.ts` | `/quests` command dispatcher |
| `src/renderers/*.ts` | TUI renderers for tools, commands, and changelogs |
| `src/logger.ts` | Namespaced debug logging |

## Development

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npx vitest run --reporter=json` | Run unit tests (vitest) |
| `npm run style` | Lint and format check (biome) |
| `npm run style:fix` | Auto-fix biome issues |

## Writing tests

- One test file per source file under `src/`; tests live in `test/` mirroring the `src/` structure.
- Behavioural tests for a module belong in its corresponding test file. Do not create separate scenario-only test files.
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

## Do NOT

- Edit `node_modules/` or generated files
- Skip tests after behavior changes
- Duplicate documentation across `docs/` files
