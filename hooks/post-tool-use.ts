/**
 * PostToolUse hook: trigger knowledge vault indexing on file writes.
 *
 * Detects Write/Edit to watched directories (vault + extra_dirs from config),
 * appends the path to the indexing queue, and pokes the Haiku sidecar.
 * Launches the sidecar on first trigger if not already running.
 *
 * Stdin: { tool_name, tool_input: { file_path }, cwd, ... }
 * Stdout: brief status line (shown to user)
 */

import { relative } from "path";
import {
  enqueue,
  isAlive,
  launch,
  poke,
  loadWatchedDirs,
  isWatched,
} from "@agiterra/knowledge-indexer-tools";

interface HookInput {
  tool_name: string;
  tool_input: { file_path?: string };
  cwd: string;
}

async function main() {
  let input: HookInput | undefined;
  try {
    const raw = await Bun.stdin.text();
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  if (!input) process.exit(0);

  if (input.tool_name !== "Write" && input.tool_name !== "Edit") {
    process.exit(0);
  }

  const filePath = input.tool_input?.file_path;
  if (!filePath) process.exit(0);

  const cwd = input.cwd;
  const watchedDirs = loadWatchedDirs(cwd);

  if (!isWatched(filePath, watchedDirs)) {
    process.exit(0);
  }

  const rel = relative(cwd, filePath);
  if (rel.includes("index-queue")) process.exit(0);

  await enqueue(cwd, rel);

  const alive = await isAlive(cwd);
  if (!alive) {
    await launch(cwd);
    setTimeout(async () => {
      try { await poke(cwd); } catch { /* sidecar may still be starting */ }
    }, 5000);
    console.log(`[kx] sidecar launched, queued: ${rel}`);
  } else {
    await poke(cwd);
    console.log(`[kx] queued: ${rel}`);
  }

  process.exit(0);
}

main();
