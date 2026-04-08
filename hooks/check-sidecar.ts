/**
 * CLI for sidecar management. Used by skills and for debugging.
 *
 * Usage: bun run check-sidecar.ts <status|start|stop>
 */

import { isAlive, healthCheck, launch, stop } from "./sidecar.js";

const command = process.argv[2];

async function main() {
  switch (command) {
    case "status": {
      const alive = await isAlive();
      if (!alive) {
        console.log("kx sidecar: not running");
        return;
      }
      const healthy = await healthCheck();
      console.log(`kx sidecar: ${healthy ? "running (healthy)" : "running (unresponsive)"}`);
      break;
    }

    case "start": {
      const cwd = process.cwd();
      await launch(cwd);
      console.log("kx sidecar: launched");
      break;
    }

    case "stop": {
      await stop();
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
