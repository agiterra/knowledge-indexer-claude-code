# Knowledge Indexer — Auto-Index Plugin

Automatically indexes knowledge vault files when they're written.
Manages a headless Haiku sidecar agent for keyword generation, semantic
indexing, and vector embedding.

## How It Works

1. **PostToolUse hook** detects Write/Edit to watched directories
2. Changed file path is appended to `.knowledge/meta/index-queue.txt`
3. Hook ensures a Haiku sidecar (`kx`) is running via crew-tools
4. Sidecar processes the queue: keyword gen → index update → vectorize

The sidecar owns all indexing work. The hook is just a trigger.

## Watched Directories

Reads `.knowledge/config.json` for `extra_dirs` (same config as knowledge-tools).
Always watches `.knowledge/` plus any configured extra directories.

## Skills

- `/knowledge-indexer:start` — Manually start the sidecar
- `/knowledge-indexer:stop` — Manually stop the sidecar

## Hooks

- **PostToolUse** (Write, Edit) — Trigger indexing on vault writes
- **SessionEnd** — Stop sidecar on graceful exit

## Sidecar Lifecycle

- Launched on first vault write (lazy start)
- Reused if already running and responsive
- Replaced if found unresponsive (health check via ping)
- Stopped on session end

## Dependencies

- `@agiterra/knowledge-tools` — index-vault.py, vectorize.py, config
- `@agiterra/crew-tools` — screen sessions, agent lifecycle
