import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { parseCsv, buildUpdateSalesInfo } from "../../../lib/csvToSql.js";
import { fetchSalesIds } from "../../../lib/queries.js";

function parseArgs(): { userId: number; variation: string } {
  const args = process.argv.slice(2);
  const get = (key: string) =>
    args.find((a) => a.startsWith(`--${key}=`))?.split("=")[1];

  const userIdStr = get("userId");
  const variation = get("variation");

  if (!userIdStr)
    throw new Error("--userId が指定されていません (例: --userId=1018)");
  if (!variation)
    throw new Error("--variation が指定されていません (例: --variation=A)");
  if (!/^\d+$/.test(userIdStr))
    throw new Error("--userId は数値で指定してください");

  return { userId: Number(userIdStr), variation };
}

async function main() {
  const { userId, variation } = parseArgs();

  const template = readFileSync(
    join(import.meta.dirname, "updateSalesInfo.template.sql"),
    "utf-8",
  );
  const csvContent = readFileSync(
    join(import.meta.dirname, "data/in.csv"),
    "utf-8",
  );

  const rows = parseCsv(csvContent);
  const orderIds = rows.map((r) => r.order_id);
  const salesIds = await fetchSalesIds(orderIds);
  const sql = buildUpdateSalesInfo(
    template,
    csvContent,
    userId,
    variation,
    salesIds,
  );

  console.log("==== Generated ====");
  console.log(sql);
  console.log("===================");

  const outputPath = join(import.meta.dirname, "data/out.sql");
  writeFileSync(outputPath, sql, "utf-8");
  console.log(`\n✔ ${outputPath} に出力しました`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("❌ 処理に失敗しました:", err.message);
    process.exit(1);
  });
}
