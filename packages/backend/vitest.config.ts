import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid database connection issues
      },
    },
    testTimeout: 30000, // 30 second timeout per test
    hookTimeout: 30000, // 30 second timeout for hooks
    globalTeardown: './vitest.teardown.ts', // Global teardown to close pool once
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
