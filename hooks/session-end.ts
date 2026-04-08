/**
 * SessionEnd hook: no-op.
 *
 * Sidecars are per-project and shared by all agents. They clean themselves
 * up via idle timeout (1 hour). Individual agent exits don't stop the sidecar.
 */

// Intentionally empty — sidecar lifecycle is not tied to any single agent.
process.exit(0);
