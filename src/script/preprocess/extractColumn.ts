import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { parseCsv, extractColumn } from "../../lib/csv.js";

/**
 * レシピの `preprocess-csv`（`csv:<列名>`）を満たす最小の汎用CLI。
 * CSVの指定列を抽出し、カンマ区切りで標準出力する。
 * 使い方: tsx src/script/preprocess/extractColumn.ts <csvPath> <column>
 */
function parseArgs(): { csvPath: string; column: string } {
  const [csvPath, column] = process.argv.slice(2);
  if (!csvPath || !column) {
    throw new Error(
      "使い方: tsx src/script/preprocess/extractColumn.ts <csvPath> <column>",
    );
  }
  return { csvPath, column };
}

function main() {
  const { csvPath, column } = parseArgs();
  const content = readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);
  console.log(extractColumn(rows, column));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
