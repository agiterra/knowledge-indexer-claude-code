/**
 * CLI for sidecar management. Used by skills and for debugging.
 *
 * Usage: bun run check-sidecar.ts <status|start|stop>
 */

import { isAlive, healthCheck, launch, stop } from "@agiterra/knowledge-indexer-tools";

const command = process.argv[2];
const cwd = process.cwd();

async function main() {
  switch (command) {
    case "status": {
      const alive = await isAlive(cwd);
      if (!alive) {
        console.log("kx sidecar: not running");
        return;
      }
      const healthy = await healthCheck(cwd);
      console.log(`kx sidecar: ${healthy ? "running (healthy)" : "running (unresponsive)"}`);
      break;
    }

    case "start": {
      await launch(cwd);
      console.log("kx sidecar: launched");
      break;
    }

    case "stop": {
      await stop(cwd);
      console.log("kx sidecar: stopped");
      break;
    }

    default:
      console.error(`Usage: check-sidecar.ts <status|start|stop>`);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(`[kx] error: ${e}`);
  process.exit(1);
});
