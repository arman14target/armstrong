import { resolve } from "path";
import { defineConfig } from "vitest/config";

// Unit tests for pure logic in lib/. No DOM needed (functions guard on
// `typeof window`), so the default node environment is fine.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
