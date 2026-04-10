## Road to v1.0.0

### core
- [x] initial boilerplate with `/quests version` and `/quests changelog` commands
- [x] TypeScript + Biome + Vitest toolchain
- [x] Taskfile dev workflow, CI, and release automation
- [x] quest list data model and in-memory session storage
  - `/quests add <description>` command and tool
  - `/quests list` command and tool
  - `/quests done <id>` command and tool
  - `/quests clear` command and tool
- [x] agent prompt guidelines for quest management
- [ ] dynamic `<system-reminder>` nudges via `context` event when the quest tool hasn't been used recently
- [ ] lightweight snapshot capture at quest creation
- [ ] `/quests rollback <id>` command and tool
- [ ] snapshot restoration logic (file state + conversation context)

### observability
- [x] progress indicator for active quest (e.g., 3 of 7 complete)
- [ ] quest status widget in footer or status line
- [ ] quest history view with timestamps
- [ ] debug logging for snapshot/rollback operations

### config and quality
- [ ] configurable quest persistence (memory-only vs file-backed)
- [ ] max quest limit per session
- [ ] snapshot size limits and exclusions
- [ ] validation gates before rollback (confirm destructive restore)
- [ ] agent skill for quest-driven development workflows

### nice to have (v1.x.x)
- [ ] quest templates (e.g., "Implement feature", "Refactor module", "Write tests")
- [ ] automatic quest suggestions based on agent intent
- [ ] quest dependencies (block quest B until quest A is done)
- [ ] export quest log as markdown checklist
- [ ] integration with external task trackers (GitHub issues, Linear)

### v1.0.0 and beyond
- [ ] branch-aware quests (quests survive `/fork`)
- [ ] cross-session quest archive
- [ ] collaborative quests across distributed agents
