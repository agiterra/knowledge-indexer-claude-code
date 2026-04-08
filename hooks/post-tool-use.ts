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

import { resolve, relative } from "path";
import { readFileSync, existsSync } from "fs";
import { enqueue, isAlive, launch, poke } from "./sidecar.js";

interface HookInput {
  tool_name: string;
  tool_input: { file_path?: string; command?: string };
  cwd: string;
}

/** Load watched directories from knowledge-tools config. */
function loadWatchedDirs(cwd: string): string[] {
  const vaultDir = process.env.KNOWLEDGE_VAULT ?? ".knowledge";
  const configPath = resolve(cwd, vaultDir, "config.json");
  const dirs = [resolve(cwd, vaultDir)];

  try {
    const cfg = JSON.parse(readFileSync(configPath, "utf-8"));
    for (const d of cfg.extra_dirs ?? []) {
      const abs = resolve(cwd, d);
      if (existsSync(abs)) {
        dirs.push(abs);
      }
    }
  } catch {
    // No config or parse error — just use vault dir
  }

  return dirs;
}

/** Check if a file path falls under any watched directory. */
function isWatched(filePath: string, watchedDirs: string[]): boolean {
  const abs = resolve(filePath);
  return watchedDirs.some((dir) => abs.startsWith(dir + "/") || abs === dir);
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

  // Only handle Write and Edit
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

  // Skip queue file itself to avoid loops
  const rel = relative(cwd, filePath);
  if (rel.includes("index-queue")) process.exit(0);

  // Enqueue the file
  await enqueue(cwd, rel);

  // Ensure sidecar is running, then poke it
  const alive = await isAlive();
  if (!alive) {
    await launch(cwd);
    // Give sidecar time to boot before poking
    setTimeout(async () => {
      try { await poke(); } catch { /* sidecar may still be starting */ }
    }, 5000);
    console.log(`[kx] sidecar launched, queued: ${rel}`);
  } else {
    await poke();
    console.log(`[kx] queued: ${rel}`);
  }

  process.exit(0);
}

main();
