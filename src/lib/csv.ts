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

/**
 * 行データから指定列の値を取り出し、カンマ区切りの文字列にする。
 * レシピの `preprocess-csv`（例: `csv:order_id`）を満たすための処理。
 * @param rows - `parseCsv` で得た行データ
 * @param column - 抽出する列名
 * @returns カンマ区切りの値（例: "10001,10002,10003"）
 * @throws 指定列が存在しない場合
 */
export function extractColumn(rows: Row[], column: string): string {
  if (rows.length > 0 && !(column in rows[0])) {
    throw new Error(
      `列 "${column}" が見つかりません（存在する列: ${Object.keys(rows[0]).join(", ")}）`,
    );
  }
  return rows.map((r) => r[column]).join(",");
}
