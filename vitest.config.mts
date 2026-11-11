import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    // Spawning many workers at once times out on this filesystem (OneDrive);
    // capping parallelism keeps per-file worker startup under the limit.
    maxWorkers: 4,
  },
});
