# knowledge-indexer

> Auto-indexes your agent's knowledge vault on every write. Spawns a per-project Haiku sidecar that generates a summary + keywords for each changed file and triggers vector embedding, so search across vault files is fast and semantic.

## What this gets you

- **Faster vault search** — semantic similarity + keyword match across all your `.knowledge/` markdown files
- **No manual indexing** — runs transparently on file write via this plugin's `PostToolUse` hook
- **One sidecar per project** — keyed by project directory hash, so vaults across different projects don't collide
- **Zero-config defaults** — if you've already installed `knowledge`, this just works

## Quick setup

Ask your agent:

> "Install the Agiterra knowledge-indexer plugin alongside knowledge."

Or manually:

```
/plugin install knowledge-indexer@agiterra
```

The sidecar runs as a Haiku Claude Code agent and uses your runtime's existing model auth — nothing extra to configure if your agent runtime is already authenticated.

## Quick example

After install, the sidecar starts up the first time a vault file is written (lazy start), or you can start it manually:

```
/knowledge-indexer:start
```

Verify it's running:

```
/knowledge-indexer:start    # reports "running (healthy)" if already up
```

The sidecar is a Claude Code agent (`--model haiku`) running inside a managed screen session, registered as `kx-<8-char-cwd-hash>` with the display name `KX (<project-dir>)`. It is not a plain grep-able `bun` process.

Then, from inside your agent:

> "Search my vault for entries about 'wire reaper'"

Should return results from any watched `.md` that mentions the concept, even via synonyms.

## For the agent

No MCP tools. Two slash-commands are exposed for manual sidecar control:

- `/knowledge-indexer:start` — start the sidecar (or report it already running)
- `/knowledge-indexer:stop` — stop the sidecar

Day to day you don't need either — the sidecar starts itself on the first vault write and self-reaps when idle. Your actual search interaction is via the `knowledge` plugin's search skill.

The sidecar:
- Is triggered by this plugin's `PostToolUse` (Write|Edit) hook, which detects writes under watched directories, appends the changed path to `.knowledge/meta/index-queue.txt`, and pokes the sidecar
- For each queued file: reads it, generates a one-line summary and 10–25 keywords (concrete terms, themes, synonyms, abbreviations), then updates the vault index
- Runs an incremental vectorize pass (via knowledge-tools' `vectorize.py`) after draining the queue

### Watched directories

The hook watches `.knowledge/` plus any `extra_dirs` listed in `.knowledge/config.json` (the same config knowledge-tools reads). Any file written under a watched directory is queued.

The journal DB (`.knowledge/journal.db`) is intentionally NOT watched — journal appends are high-frequency and would thrash the sidecar. Journal searches use the journal's own SQLite FTS5 index.

### Sidecar lifecycle

- **One per project directory**, shared by all agents working in that repo (keyed by a hash of the project dir, not by agent ID).
- **Lazy start** on the first watched write; reused if already running and responsive; replaced if found unresponsive (health check via `ping`).
- **Self-reaps after ~1 hour idle.** Individual agent exits do NOT stop the sidecar — its `SessionEnd` behavior is intentionally a no-op.
- **No Wire identity (since v1.2.9).** The launcher sets `AGENT_PRIVATE_KEY=""`, so the sidecar's wire MCP server exits at startup and nothing registers `kx-<hash>` on the Wire. Pokes and health pings go through the sidecar's screen session, not the Wire. crew-tools skips its Wire checks for this explicit blank. Do not give a sidecar a Wire identity (Brioche, 2026-10-16).
- **Accepted limit: the persona's `~/.zshenv` still exports the key.** The blank covers the sidecar's process env and its MCP servers. Its Bash tool shells source `~/.zshenv` and can see the key again. This is not changed on purpose (Brioche, 2026-10-16): the sidecar runs as the persona's uid, so it can read the key's source file anyway. Removing the export gives no real isolation and can break the persona's own Wire. Real isolation needs a separate uid per sidecar, which is not planned now.

## Reference

| Var | Default | Description |
|---|---|---|
| `KNOWLEDGE_VAULT` | `.knowledge` | Path (relative to project dir) to the vault to watch |

## Concepts

- [Knowledge vaults — what they are and where they live](https://github.com/agiterra/handbook/blob/main/CORE.md#3-knowledge-vaults)

## Related plugins

- [`knowledge`](https://github.com/agiterra/knowledge-claude-code) — required; this is its indexer

## License

MIT.
