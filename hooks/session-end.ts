/**
 * SessionEnd hook: clean up the indexer sidecar on graceful exit.
 */

import { stop } from "@agiterra/knowledge-indexer-tools";

async function main() {
  try {
    await stop();
    console.log("[kx] sidecar stopped");
  } catch (e) {
    console.error(`[kx] cleanup error: ${e}`);
  }
  process.exit(0);
}

main();
