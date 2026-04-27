# knowledge-indexer-claude-code

Auto-indexes knowledge vault files on write — spawns a Haiku sidecar for keyword extraction and vector embeddings.

## Prerequisites

- `knowledge-claude-code` plugin installed
- Bun (https://bun.sh)

## Install

```
/plugin install agiterra/knowledge-indexer-claude-code
```

## Tools / Skills

No MCP tools or skills exposed. The indexer runs as a background process triggered by file write hooks. It watches the `.knowledge/` vault and automatically updates the keyword and vector indexes whenever vault files change.

### What gets indexed

Markdown vault files (`.knowledge/**/*.md`) trigger the indexer on write. The journal database (`.knowledge/journal.db`) does **not** — journal appends are high-frequency and would thrash the sidecar. Run `knowledge:journal` operations and the journal SQL backup updates on its own; vault searches across journal entries continue to work via the journal's own SQLite FTS5 index.

## Configuration

| Var | Default | Description |
|-----|---------|-------------|
| `KNOWLEDGE_DIR` | `.knowledge/` | Path to the vault to watch |
| `ANTHROPIC_API_KEY` | — | Required for the Haiku sidecar (keyword extraction + embeddings) |
