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

const CSV_FILTER_RE = /^(.+?)\s*=\s*(.+)$/;

/**
 * filter文字列を「列名 = 値」の形式でのみ解析する。
 * CSV値は常に文字列なのでSQLのようなクォート区別は不要。
 * @param filter - 解析するfilter文字列（例: "ステータス = shipped"）
 * @returns 解析結果（列名と値）。形式に合わなければ null
 */
export function parseCsvFilter(
  filter: string,
): { column: string; value: string } | null {
  const m = filter.match(CSV_FILTER_RE);
  if (!m) return null;
  return { column: m[1].trim(), value: m[2].trim() };
}

/**
 * 行データを「列名 = 値」の条件で絞り込む。
 * レシピの `preprocess-csv` に任意の `filter` が付いた場合に使う（例: ステータスが
 * 特定の値の行だけを対象にしたい、など列抽出だけでは表現できない前処理）。
 * @param rows - `parseCsv` で得た行データ
 * @param filter - 「列名 = 値」形式のfilter文字列
 * @returns 条件に一致する行のみの配列
 * @throws filterが形式に合わない、または指定列が存在しない場合
 */
export function filterRows(rows: Row[], filter: string): Row[] {
  const parsed = parseCsvFilter(filter);
  if (!parsed) {
    throw new Error(`filterは "列名 = 値" 形式のみ許可します: ${filter}`);
  }
  if (rows.length > 0 && !(parsed.column in rows[0])) {
    throw new Error(
      `列 "${parsed.column}" が見つかりません（存在する列: ${Object.keys(rows[0]).join(", ")}）`,
    );
  }
  return rows.filter((r) => r[parsed.column] === parsed.value);
}
