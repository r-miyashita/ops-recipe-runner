import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import {
  parseCsv,
  buildUpdateShippingAndBillingInfo,
} from "../../../lib/csvToSql.js";
import { parseDate } from "../../../lib/dateUtils.js";
import { fetchInvoiceIds } from "../../../lib/queries.js";

function parseArgs(): { userId: number; baseDate: Date } {
  const args = process.argv.slice(2);
  const get = (key: string) =>
    args.find((a) => a.startsWith(`--${key}=`))?.split("=")[1];

  const userIdStr = get("userId");
  const baseDateStr = get("baseDate");

  if (!userIdStr)
    throw new Error("--userId が指定されていません (例: --userId=1018)");
  if (!baseDateStr)
    throw new Error(
      "--baseDate が指定されていません (例: --baseDate=2026-06-01)",
    );
  if (!/^\d+$/.test(userIdStr))
    throw new Error("--userId は数値で指定してください");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baseDateStr))
    throw new Error("--baseDate は YYYY-MM-DD 形式で指定してください");

  return { userId: Number(userIdStr), baseDate: parseDate(baseDateStr) };
}

async function main() {
  const { userId, baseDate } = parseArgs();

  const template = readFileSync(
    join(import.meta.dirname, "updateShippingAndBillingInfo.template.sql"),
    "utf-8",
  );
  const csvContent = readFileSync(
    join(import.meta.dirname, "data/in.csv"),
    "utf-8",
  );

  const rows = parseCsv(csvContent);
  const orderIds = rows.map((r) => r.order_id);
  const invoiceIds = await fetchInvoiceIds(orderIds);
  const sql = buildUpdateShippingAndBillingInfo(
    template,
    csvContent,
    userId,
    baseDate,
    invoiceIds,
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
