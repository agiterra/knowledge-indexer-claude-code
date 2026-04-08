/**
 * SessionEnd hook: clean up the indexer sidecar on graceful exit.
 */

import { stop } from "./sidecar.js";

async function main() {
  try {
    await stop();
    console.log("[kx] sidecar stopped");
  } catch (e) {
    // Best effort — don't fail the session end
    console.error(`[kx] cleanup error: ${e}`);
  }
  process.exit(0);
}

main();
