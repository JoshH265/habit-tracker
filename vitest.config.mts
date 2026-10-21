import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws when imported outside a React Server Component
      // graph. Tests import the same modules, so point it at a no-op stub.
      "server-only": fileURLToPath(
        new URL("./src/test/server-only-stub.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    pool: "forks",
    // Test files share one scratch database, so they run one at a time.
    fileParallelism: false,
  },
});
