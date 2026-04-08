---
description: Start the knowledge indexer sidecar (Haiku agent for auto-indexing vault writes).
allowed-tools: Bash
---

# Start Knowledge Indexer

Launch the Haiku indexer sidecar. It will automatically index knowledge vault
files when they're written.

1. Check if a sidecar is already running:
```
Bash(command="bun run '${CLAUDE_PLUGIN_ROOT}/hooks/check-sidecar.ts' status")
```

2. If already running and healthy, report that and stop.

3. If not running, launch it:
```
Bash(command="bun run '${CLAUDE_PLUGIN_ROOT}/hooks/check-sidecar.ts' start")
```

4. Report the result.
