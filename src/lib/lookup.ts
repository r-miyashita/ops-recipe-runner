import { RowDataPacket } from "mysql2/promise";
import { createConnection } from "./db.js";

/**
 * 宣言的lookupの1ステップ。`doc/recipe-format.md` の `lookups[].steps` に対応する。
 */
export interface LookupStep {
  from: string;
  select: string;
  key: string;
  filters?: string[];
}

const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const FILTER_RE = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\d+|'[^']*')$/;

/**
 * テーブル名・列名として安全なベア識別子か検証する。
 * mysql2は識別子をバインドできないため、埋め込み前にこの形式チェックと
 * 実スキーマの存在チェック（`getTableColumns`）の両方を通す必要がある。
 * @param name - 検証する識別子文字列
 * @returns 英数字とアンダースコアのみ（先頭は英字/アンダースコア）なら true
 */
export function isValidIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name);
}

/**
 * filter文字列を「列名 = リテラル」の厳格な形式でのみ解析する。
 * 自由記述のSQL断片（例: "1=1 OR ..."）をレシピ経由で注入できないようにするガード。
 * @param filter - 解析するfilter文字列
 * @returns 解析結果（列名とリテラル）。形式に合わなければ null
 */
export function parseFilter(
  filter: string,
): { column: string; literal: string } | null {
  const m = filter.match(FILTER_RE);
  if (!m) return null;
  return { column: m[1], literal: m[2] };
}

interface ColumnRow extends RowDataPacket {
  COLUMN_NAME: string;
}

async function getTableColumns(
  conn: Awaited<ReturnType<typeof createConnection>>,
  table: string,
): Promise<Set<string>> {
  const [rows] = await conn.query<ColumnRow[]>(
    `SELECT COLUMN_NAME
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?`,
    [table],
  );
  return new Set(rows.map((r) => r.COLUMN_NAME));
}

/**
 * 宣言的なlookup(steps)を順に実行し、最終ステップのID配列を返す。
 * 各ステップの `from`/`select`/`key` は実スキーマ（information_schema）で存在確認してから
 * バッククォート付きで埋め込む。`filters` は「列名 = リテラル」形式のみ許可する。
 * @param steps - 実行するlookupステップの配列（先頭ステップの key は initialIds で埋める）
 * @param initialIds - 最初のステップに渡すID配列（CSV由来など）
 * @returns 最終ステップの select 列の値（文字列配列）。initialIds が空なら空配列
 * @throws 識別子が実スキーマに存在しない、または filters が許可形式でない場合
 */
export async function runLookupSteps(
  steps: LookupStep[],
  initialIds: string[],
): Promise<string[]> {
  if (initialIds.length === 0) return [];
  const conn = await createConnection();
  try {
    let ids = initialIds;
    for (const step of steps) {
      if (
        !isValidIdentifier(step.from) ||
        !isValidIdentifier(step.select) ||
        !isValidIdentifier(step.key)
      ) {
        throw new Error(
          `不正な識別子です（table/column名のみ許可）: ${JSON.stringify(step)}`,
        );
      }

      const columns = await getTableColumns(conn, step.from);
      if (columns.size === 0) {
        throw new Error(`テーブルが実スキーマに存在しません: ${step.from}`);
      }
      if (!columns.has(step.select)) {
        throw new Error(`列が存在しません: ${step.from}.${step.select}`);
      }
      if (!columns.has(step.key)) {
        throw new Error(`列が存在しません: ${step.from}.${step.key}`);
      }

      const filterClauses: string[] = [];
      for (const f of step.filters ?? []) {
        const parsed = parseFilter(f);
        if (!parsed) {
          throw new Error(
            `filtersは "列名 = リテラル" 形式のみ許可します: ${f}`,
          );
        }
        if (!columns.has(parsed.column)) {
          throw new Error(
            `filtersの列が存在しません: ${step.from}.${parsed.column}`,
          );
        }
        filterClauses.push(`\`${parsed.column}\` = ${parsed.literal}`);
      }

      const sql = `SELECT DISTINCT \`${step.select}\` FROM \`${step.from}\` WHERE \`${step.key}\` IN (?)${
        filterClauses.length > 0 ? ` AND ${filterClauses.join(" AND ")}` : ""
      }`;
      const [rows] = await conn.query<RowDataPacket[]>(sql, [ids]);
      ids = rows.map((r) => String(r[step.select]));
      if (ids.length === 0) return [];
    }
    return ids;
  } finally {
    await conn.end();
  }
}
