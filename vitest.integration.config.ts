import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 結合テストのみを対象にする（DB依存）。docker compose up -d db が前提。
    include: ["**/*.integration.test.ts"],
  },
});
