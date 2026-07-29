import { RowDataPacket } from "mysql2/promise";
import { createConnection } from "./db.js";

interface InvoiceRow extends RowDataPacket {
  invoice_id: string;
}

interface SalesRow extends RowDataPacket {
  sales_id: string;
}

/**
 * 受注IDの配列をもとに、対応する請求書IDをDBから取得する。
 * 論理削除済みのレコードは除外する。
 * @param orderIds - 対象受注IDの配列
 * @returns 請求書IDの配列（orderIdsが空の場合は空配列を返す）
 */
export async function fetchInvoiceIds(orderIds: string[]): Promise<string[]> {
  if (orderIds.length === 0) return [];
  const conn = await createConnection();
  try {
    const [rows] = await conn.query<InvoiceRow[]>(
      `SELECT invoice_id
       FROM t_order
       WHERE order_id IN (?)
         AND logical_delete_flag = 0`,
      [orderIds],
    );
    return rows.map((r) => r.invoice_id);
  } finally {
    await conn.end();
  }
}

/**
 * 受注IDの配列をもとに、対応する売上IDをDBから取得する。
 * 論理削除済みのレコードは除外する。
 * @param orderIds - 対象受注IDの配列
 * @returns 売上IDの配列（orderIdsが空の場合は空配列を返す）
 */
export async function fetchSalesIds(orderIds: string[]): Promise<string[]> {
  if (orderIds.length === 0) return [];
  const conn = await createConnection();
  try {
    const [rows] = await conn.query<SalesRow[]>(
      `SELECT sales_id
       FROM t_sales
       WHERE order_detail_id IN (
         SELECT order_detail_id
         FROM t_order_detail
         WHERE order_id IN (?)
           AND logical_delete_flag = 0
       )
         AND logical_delete_flag = 0
`,
      [orderIds],
    );
    return rows.map((r) => r.sales_id);
  } finally {
    await conn.end();
  }
}
