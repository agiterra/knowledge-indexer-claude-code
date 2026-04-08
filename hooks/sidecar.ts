/**
 * Sidecar lifecycle management for the knowledge indexer.
 *
 * Manages a headless Haiku agent that handles all indexing work:
 * keyword generation, index-vault updates, and vectorize incremental.
 *
 * Uses crew-tools Orchestrator for agent lifecycle (screen sessions).
 * Communication via a file-based queue + screen sendKeys to poke the sidecar.
 */

import { join } from "path";
import { Orchestrator, screen } from "@agiterra/crew-tools";

const SIDECAR_ID = "kx";
const SIDECAR_DISPLAY = "KX (indexer)";

// Resolve knowledge-tools scripts path
function resolveScriptsPath(): string {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ?? import.meta.dir;
  return join(pluginRoot, "node_modules", "@agiterra", "knowledge-tools", "scripts");
}

/** Queue file path — one path per line. */
export function queuePath(cwd: string): string {
  return join(cwd, ".knowledge", "meta", "index-queue.txt");
}

/** Append a file path to the indexing queue. */
export async function enqueue(cwd: string, filePath: string): Promise<void> {
  const qp = queuePath(cwd);
  await Bun.write(qp, (await readQueue(cwd)) + filePath + "\n");
}

/** Read current queue entries. */
async function readQueue(cwd: string): Promise<string> {
  const qp = queuePath(cwd);
  const file = Bun.file(qp);
  if (await file.exists()) {
    return await file.text();
  }
  return "";
}

/** Check if the sidecar is alive. */
export async function isAlive(): Promise<boolean> {
  const orch = new Orchestrator();
  const agent = orch.store.getAgent(SIDECAR_ID);
  if (!agent) return false;
  return screen.isAlive(agent.screen_name);
}

/** Find and health-check an existing sidecar. Returns true if responsive. */
export async function healthCheck(): Promise<boolean> {
  if (!(await isAlive())) return false;

  const orch = new Orchestrator();
  try {
    // Send a ping and check for response
    await orch.sendToAgent(SIDECAR_ID, "ping\n");
    // Give it a moment to respond
    await new Promise((r) => setTimeout(r, 2000));
    const output = await orch.readAgent(SIDECAR_ID);
    // If the screen has content and isn't stuck, consider it alive
    return output.length > 0;
  } catch {
    return false;
  }
}

/** Launch a new sidecar. Kills any unresponsive existing one first. */
export async function launch(cwd: string): Promise<void> {
  const orch = new Orchestrator();
  const scriptsPath = resolveScriptsPath();

  // Check for existing
  const existing = orch.store.getAgent(SIDECAR_ID);
  if (existing) {
    const alive = await screen.isAlive(existing.screen_name);
    if (alive) {
      // Try health check before killing
      const healthy = await healthCheck();
      if (healthy) return; // Already running and responsive
      // Unresponsive — kill it
      await orch.stopAgent(SIDECAR_ID);
    } else {
      // Dead record — clean up
      orch.store.deleteAgent(SIDECAR_ID);
    }
  }

  const prompt = `You are KX, a knowledge vault indexer sidecar. You run as Haiku to save tokens.

Your job: when you receive a message, check the index queue at ${queuePath(cwd)} for file paths (one per line). For each file:

1. Read the file content
2. Generate a one-line semantic summary
3. Generate 10-25 keywords: concrete terms, abstract themes, synonyms, abbreviations
4. Run: python3 ${scriptsPath}/index-vault.py update <path> '<summary>' '<keywords-csv>' 'none'

After processing ALL queued files, clear the queue file, then run:
  python3 ${scriptsPath}/vectorize.py --incremental

If the queue is empty when you check, just run vectorize incremental in case journal entries changed.

If you receive "ping", respond with "pong" and nothing else.

Format your work concisely. No commentary — just do the indexing and report what you indexed.`;

  await orch.launchAgent({
    id: SIDECAR_ID,
    displayName: SIDECAR_DISPLAY,
    runtime: "claude-code",
    projectDir: cwd,
    extraFlags: "--model haiku",
    prompt,
  });
}

/** Poke the sidecar to process the queue. */
export async function poke(): Promise<void> {
  const orch = new Orchestrator();
  await orch.sendToAgent(SIDECAR_ID, "process queue\n");
}

/** Stop the sidecar. */
export async function stop(): Promise<void> {
  const orch = new Orchestrator();
  const agent = orch.store.getAgent(SIDECAR_ID);
  if (!agent) return;

  const alive = await screen.isAlive(agent.screen_name);
  if (alive) {
    await orch.stopAgent(SIDECAR_ID);
  } else {
    orch.store.deleteAgent(SIDECAR_ID);
  }
}
