import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 結合テスト（DB依存）は `npm test` から除外する。
    // 実行は `npm run test:integration`（docker compose up -d db が前提）。
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.integration.test.ts",
    ],
  },
});
