# knowledge-indexer

> Auto-indexes your agent's knowledge vault on every write. Spawns a per-project Haiku sidecar that extracts keywords + vector embeddings, so search across vault files is fast and semantic.

## What this gets you

- **Faster vault search** — semantic similarity + keyword match across all your `.knowledge/` markdown files
- **No manual indexing** — runs transparently on file write via the knowledge plugin's hooks
- **One sidecar per project** — keyed by project directory hash, so vaults across different projects don't collide
- **Zero-config defaults** — if you've already installed `knowledge`, this just works

## Quick setup

Ask your agent:

> "Install the Agiterra knowledge-indexer plugin alongside knowledge."

Or manually:

```
/plugin install knowledge-indexer@agiterra
```

You'll need `ANTHROPIC_API_KEY` in your environment — the sidecar uses Claude Haiku for keyword extraction.

## Quick example

After install, the sidecar starts up the first time the knowledge plugin writes a vault file. Verify:

```bash
ps aux | grep knowledge-indexer | grep -v grep
```

You should see a `bun` process named `kx-<8-char-cwd-hash>`. From inside Claude Code:

> "Search my vault for entries about 'wire reaper'"

Should return results from any `.knowledge/**/*.md` that mention the concept, even via synonyms.

## For the agent

No MCP tools or slash-commands exposed. The indexer runs in the background, indexing automatically. Your interaction is via the `knowledge` plugin's search skill.

The sidecar:
- Watches `.knowledge/**/*.md` for writes (via knowledge plugin's PostToolUse hook)
- Computes semantic embeddings + keyword extraction for each changed file
- Persists indexes alongside the vault
- Re-indexes on file change, deletes on file delete

The journal DB (`.knowledge/journal.db`) is intentionally NOT watched — journal appends are high-frequency and would thrash the sidecar. Journal searches use the journal's own SQLite FTS5 index.

## Reference

| Var | Default | Description |
|---|---|---|
| `KNOWLEDGE_DIR` | `.knowledge/` | Path to the vault to watch |
| `ANTHROPIC_API_KEY` | (required) | Haiku API access for keyword extraction + embeddings |

## Concepts

- [Knowledge vaults — what they are and where they live](https://github.com/agiterra/handbook/blob/main/CORE.md#3-knowledge-vaults)

## Related plugins

- [`knowledge`](https://github.com/agiterra/knowledge-claude-code) — required; this is its indexer

## License

MIT.
