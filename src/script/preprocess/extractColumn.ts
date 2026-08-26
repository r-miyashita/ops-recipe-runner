import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { parseCsv, extractColumn, filterRows } from "../../lib/csv.js";

/**
 * レシピの `preprocess-csv`（`csv:<列名>`、任意で `filter`）を満たす汎用CLI。
 * CSVの指定列を抽出し、カンマ区切りで標準出力する。filterを指定すると
 * 「列名 = 値」に一致する行だけを対象にしてから抽出する。
 * 使い方: tsx src/script/preprocess/extractColumn.ts <csvPath> <column> [filter]
 */
function parseArgs(): { csvPath: string; column: string; filter?: string } {
  const [csvPath, column, filter] = process.argv.slice(2);
  if (!csvPath || !column) {
    throw new Error(
      "使い方: tsx src/script/preprocess/extractColumn.ts <csvPath> <column> [filter]",
    );
  }
  return { csvPath, column, filter };
}

function main() {
  const { csvPath, column, filter } = parseArgs();
  const content = readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);
  const targetRows = filter ? filterRows(rows, filter) : rows;
  console.log(extractColumn(targetRows, column));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
