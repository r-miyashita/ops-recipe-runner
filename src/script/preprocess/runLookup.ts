import { fileURLToPath } from "url";
import { runLookupSteps, LookupStep } from "../../lib/lookup.js";

/**
 * レシピの `preprocess-lookup`（`lookup:<名>`）を満たす汎用CLI。
 * Agentがレシピの lookups（`doc/recipe-format.md` 方式A/B）から steps を組み立て、
 * このCLIへJSONで渡す。実スキーマの検証・実行は Runner（このCLI）側の責務。
 * 使い方: tsx src/script/preprocess/runLookup.ts <steps-json> <ids-カンマ区切り>
 */
function parseArgs(): { steps: LookupStep[]; ids: string[] } {
  const [stepsJson, idsCsv] = process.argv.slice(2);
  if (!stepsJson || !idsCsv) {
    throw new Error(
      "使い方: tsx src/script/preprocess/runLookup.ts <steps-json> <ids-カンマ区切り>",
    );
  }
  const steps = JSON.parse(stepsJson) as LookupStep[];
  return { steps, ids: idsCsv.split(",") };
}

async function main() {
  const { steps, ids } = parseArgs();
  const result = await runLookupSteps(steps, ids);
  console.log(result.join(","));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("❌ 処理に失敗しました:", err.message);
    process.exit(1);
  });
}
