import { parse } from "csv-parse/sync";
import { addBusinessDays, formatDate } from "./dateUtils.js";

type Row = Record<string, string>;
type TemplateVars = Record<string, string>;

/**
 * CSV文字列を解析して行データの配列に変換する。
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
 * テンプレート文字列内の `{{key}}` 形式のプレースホルダーを vars の値で一括置換する。
 * 置換後にプレースホルダーが残っている場合はエラーを投げる。
 * @param template - プレースホルダーを含むテンプレート文字列
 * @param vars - プレースホルダーのキーと置換値のマップ
 * @returns プレースホルダーを置換済みの文字列
 * @throws 未置換のプレースホルダーが残っている場合
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  const rendered = Object.entries(vars).reduce(
    (sql, [key, val]) => sql.replaceAll(`{{${key}}}`, val),
    template,
  );
  const remaining = rendered.match(/\{\{[^}]+\}\}/g);
  if (remaining)
    throw new Error(
      `未置換のプレースホルダーがあります: ${remaining.join(", ")}`,
    );
  return rendered;
}

/**
 * CSVの行データと基準日からテンプレート置換用の変数マップを生成する。
 * 入金予定日・入金猶予日は基準日翌月初から14日加算した翌営業日を自動計算する。
 * @param rows - CSVから読み込んだ行データ
 * @param userId - オペレーターのユーザーID
 * @param baseDate - 処理月の月初日
 * @param invoiceIds - DBから取得した請求書IDの配列
 * @returns テンプレート置換用の変数マップ
 */
export function buildUpdateVars(
  rows: Row[],
  userId: number,
  baseDate: Date,
  invoiceIds: string[],
): TemplateVars {
  // 日付はローカル系で統一（jp-holidays・営業日計算・formatDate すべてローカル基準）
  const nextMonthStartDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + 1,
    1,
  );
  // 入金予定日・入金猶予日は同日（翌月初から14日加算した翌営業日）
  const depositDate = formatDate(addBusinessDays(nextMonthStartDate, 14));
  return {
    userId: String(userId),
    baseDate: formatDate(baseDate),
    shippingIds: rows.map((r) => r.shipping_id).join(","),
    newDepositDueDate: depositDate,
    newDepositGraceDate: depositDate,
    invoiceIds: invoiceIds.join(","),
  };
}

/**
 * CSVと基準日をもとにSQLテンプレートを展開して出荷日・締日変更SQLを生成する。
 * @param template - SQLテンプレート文字列
 * @param csvContent - 対象受注のCSV文字列
 * @param userId - オペレーターのユーザーID
 * @param baseDate - 処理月の月初日
 * @param invoiceIds - DBから取得した請求書IDの配列
 * @returns 実行可能なSQL文字列
 */
export function buildUpdateShippingAndBillingInfo(
  template: string,
  csvContent: string,
  userId: number,
  baseDate: Date,
  invoiceIds: string[],
): string {
  const rows = parseCsv(csvContent);
  const vars = buildUpdateVars(rows, userId, baseDate, invoiceIds);
  return renderTemplate(template, vars);
}

type SalesVariationKey = "A" | "B" | "C";

interface SalesVariation {
  salesUserId: number;
  salesUserName: string;
  salesOfficeId: number;
}

const SALES_VARIATIONS: Record<SalesVariationKey, SalesVariation> = {
  A: { salesUserId: 101, salesUserName: "teamA", salesOfficeId: 5 },
  B: { salesUserId: 201, salesUserName: "teamB", salesOfficeId: 3 },
  C: { salesUserId: 301, salesUserName: "teamC", salesOfficeId: 2 },
};

/**
 * CSVの行データと更新バリエーションから、受注・売上の担当情報更新SQL用変数マップを生成する。
 * @param rows - CSVから読み込んだ行データ（order_id を含む）
 * @param userId - オペレーターのユーザーID
 * @param variation - 更新バリエーションキー（A / B / C）
 * @param salesIds - DBから取得した売上IDの配列
 * @returns テンプレート置換用の変数マップ
 * @throws variation が未定義のキーの場合
 */
export function buildUpdateSalesInfoVars(
  rows: Row[],
  userId: number,
  variation: string,
  salesIds: string[],
): TemplateVars {
  const v = SALES_VARIATIONS[variation as SalesVariationKey];
  if (!v)
    throw new Error(
      `不明な更新バリエーションです: ${variation} (指定可能: ${Object.keys(SALES_VARIATIONS).join(", ")})`,
    );
  return {
    userId: String(userId),
    orderIds: rows.map((r) => r.order_id).join(","),
    salesUserId: String(v.salesUserId),
    salesUserName: v.salesUserName,
    salesOfficeId: String(v.salesOfficeId),
    salesIds: salesIds.join(","),
  };
}

/**
 * CSVと更新バリエーションをもとにSQLテンプレートを展開して受注・売上の担当情報変更SQLを生成する。
 * @param template - SQLテンプレート文字列
 * @param csvContent - 対象受注のCSV文字列
 * @param userId - オペレーターのユーザーID
 * @param variation - 更新バリエーションキー（A / B / C）
 * @param salesIds - DBから取得した売上IDの配列
 * @returns 実行可能なSQL文字列
 */
export function buildUpdateSalesInfo(
  template: string,
  csvContent: string,
  userId: number,
  variation: string,
  salesIds: string[],
): string {
  const rows = parseCsv(csvContent);
  const vars = buildUpdateSalesInfoVars(rows, userId, variation, salesIds);
  return renderTemplate(template, vars);
}
