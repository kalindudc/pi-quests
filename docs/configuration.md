# Configuration

> See also: [Reference](reference.md) · [Quests](quests.md)

pi-quests reads configuration from pi's settings files. Settings are merged: global settings provide defaults, project settings override.

## Settings files

| Location | Scope | Purpose |
|----------|-------|---------|
| `~/.pi/agent/settings.json` | Global | Default settings for all projects |
| `.pi/settings.json` | Project | Override global settings per repository |

The global settings path respects the `PI_CODING_AGENT_DIR` environment variable. If set, global settings are loaded from `$PI_CODING_AGENT_DIR/settings.json` instead.

## Configuration schema

Add a `pi-quests` key to your settings file:

```json
{
  "pi-quests": {
    "ids": {
      "length": 2
    },
    "display": {
      "pageSize": 10,
      "progressBarMaxWidth": 24
    },
    "nudges": {
      "initializationThreshold": 3,
      "hintIntervalMinutes": 8,
      "timeBasedToolCallThreshold": 3,
      "zeroActiveToolCallThreshold": 5,
      "staleProgressToolCallThreshold": 10,
      "complexTaskKeywords": [
        "implement",
        "refactor",
        "investigate",
        "review",
        "analyze",
        "audit",
        "plan",
        "design",
        "create",
        "build",
        "write",
        "fix"
      ]
    },
    "validation": {
      "fakeDonePattern": "\\s[-\\u2013\\u2014]\\s*(DONE|COMPLETED|FINISHED)$|\\s[([](DONE|COMPLETED|FINISHED)[)\\]]$"
    },
    "shortcuts": {
      "openQuests": "ctrl+shift+q"
    }
  }
}
```

## Options reference

### ids.length

Length of generated quest IDs in hex characters. Affects both the tool schema regex and command parser validation.

| Default | Type | Range |
|---------|------|-------|
| 2 | `number` | 1-4 |

### display.pageSize

Number of quests shown per page in the interactive quest list widget.

| Default | Type | Range |
|---------|------|-------|
| 10 | `number` | 1-50 |

### display.progressBarMaxWidth

Maximum width of the mini progress bar in the quest list widget.

| Default | Type | Range |
|---------|------|-------|
| 24 | `number` | 8-80 |

### nudges.initializationThreshold

Number of tool calls before the initialization nudge appears when the quest tool has never been used in the session.

| Default | Type | Range |
|---------|------|-------|
| 3 | `number` | 1-20 |

### nudges.hintIntervalMinutes

Minutes between quest-alignment nudges. Used for the time-based nudge after sustained tool use without quest updates.

| Default | Type | Range |
|---------|------|-------|
| 8 | `number` | 1-120 |

### nudges.timeBasedToolCallThreshold

Consecutive non-quest tool calls required before the time-based nudge can fire (in addition to the interval check).

| Default | Type | Range |
|---------|------|-------|
| 3 | `number` | 1-20 |

### nudges.zeroActiveToolCallThreshold

Consecutive non-quest tool calls required to trigger the zero-active-quests nudge.

| Default | Type | Range |
|---------|------|-------|
| 5 | `number` | 1-50 |

### nudges.staleProgressToolCallThreshold

Consecutive non-quest tool calls required to trigger the stale-progress nudge when active quests exist.

| Default | Type | Range |
|---------|------|-------|
| 10 | `number` | 1-50 |

### nudges.complexTaskKeywords

Keywords used to detect complex tasks in user prompts. When active quests are zero and a prompt matches, a nudge reminds you to break the work into trackable quests.

| Default | Type |
|---------|------|
| implement, refactor, investigate, review, analyze, audit, plan, design, create, build, write, fix | `string[]` |

### validation.fakeDonePattern

Regular expression string used to detect completion markers appended to quest descriptions (e.g. ` - DONE`). When a non-done quest matches, a reminder prompts toggling the quest instead of updating the description.

| Default | Type |
|---------|------|
| `\\s[-\\u2013\\u2014]\\s*(DONE\|COMPLETED\|FINISHED)$\|\\s[([](DONE\|COMPLETED\|FINISHED)[)\\]]$` | `string` |

### shortcuts.openQuests

Keyboard shortcut to open the interactive quest list. Default is `ctrl+shift+l`.

| Default | Type |
|---------|------|
| `ctrl+shift+l` | `string` |

## Example configurations

### Longer quest IDs

Useful when you expect more than ~250 quests in a session.

```json
{
  "pi-quests": {
    "ids": {
      "length": 3
    }
  }
}
```

### Larger quest list widget

```json
{
  "pi-quests": {
    "display": {
      "pageSize": 20,
      "progressBarMaxWidth": 40
    }
  }
}
```

### Disable nudges by raising thresholds

```json
{
  "pi-quests": {
    "nudges": {
      "initializationThreshold": 100,
      "zeroActiveToolCallThreshold": 100,
      "staleProgressToolCallThreshold": 100
    }
  }
}
```

### Custom complex-task keywords

```json
{
  "pi-quests": {
    "nudges": {
      "complexTaskKeywords": [
        "implement",
        "deploy",
        "migrate",
        "redesign"
      ]
    }
  }
}
```

### Full customization

```json
{
  "pi-quests": {
    "ids": {
      "length": 2
    },
    "display": {
      "pageSize": 15,
      "progressBarMaxWidth": 32
    },
    "nudges": {
      "initializationThreshold": 5,
      "hintIntervalMinutes": 10,
      "timeBasedToolCallThreshold": 5,
      "zeroActiveToolCallThreshold": 8,
      "staleProgressToolCallThreshold": 15,
      "complexTaskKeywords": [
        "implement",
        "refactor",
        "investigate",
        "review",
        "plan",
        "design",
        "create",
        "build"
      ]
    },
    "validation": {
      "fakeDonePattern": "\\s[-\\u2013\\u2014]\\s*(DONE|COMPLETED|FINISHED)$|\\s[([](DONE|COMPLETED|FINISHED)[)\\]]$"
    },
    "shortcuts": {
      "openQuests": "ctrl+shift+q"
    }
  }
}
```
