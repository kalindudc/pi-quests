# pi-quests

[![version 0.1.0](https://img.shields.io/badge/version-0.1.0-blue)](CHANGELOG.md)
[![MIT license](https://img.shields.io/badge/license-MIT-green)](LICENSE.md)
[![pi extension](https://img.shields.io/badge/pi-extension-purple)](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)

A quest-log for your [pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent). Keep your agent on track, one quest at a time.

## Why pi-quests?

Long agent sessions drift. Goals get lost in tool calls, side quests multiply, and the original task is forgotten under a pile of yak hair.

pi-quests gives your agent a persistent quest log — a living TODO list for the current session. Each quest is a checkpoint the agent can create, complete, and optionally roll back to if things go sideways.

- **Stay focused** — the quest log keeps the original goal visible no matter how deep the rabbit hole goes
- **Checkpoint progress** — mark milestones as quests and capture lightweight session snapshots
- **Rollback safety** — revert to a previous quest snapshot when exploration goes off track
- **Session-scoped** — quests live with the session, vanish when you start fresh

## Install

```bash
pi install npm:pi-quests
```

## Quick start

**See the extension version:**
```bash
/quests version
```

**View the changelog:**
```bash
/quests changelog
```

## Configuration

```json
// .pi/settings.json
{
  "pi-quests": {
    "display": {
      "observabilityLines": 10
    }
  }
}
```

## Documentation

| Doc | Description |
|-----|-------------|
| [Roadmap](docs/roadmap.md) | Feature backlog and progress tracker |
| [Changelog](CHANGELOG.md) | Version history |

## License

MIT — see [LICENSE.md](LICENSE.md)
