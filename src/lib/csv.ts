import { parse } from "csv-parse/sync";

type Row = Record<string, string>;

/**
 * CSV文字列を解析して行データの配列に変換する。
 * 前処理コア（Script Runner）が扱う。テンプレート置換や日付計算は Agent 側の責務。
 * @param rawContent - CSVファイルの文字列
 * @returns 1行を `Record<string, string>` で表した配列
 * @throws データ行が1件もない場合
 */
export function parseCsv(rawContent: string): Row[] {
  const rows = parse(rawContent, {
    columns: true,
    skip_empty_lines: true,
  }) as Row[];
  if (rows.length === 0) throw new Error("CSVに処理対象のデータがありません");
  return rows;
}
