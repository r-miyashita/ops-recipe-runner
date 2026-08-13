import { describe, it, expect } from "vitest";
import { fetchInvoiceIds, fetchSalesIds } from "./queries.js";

// 結合テスト（DB依存）。`docker compose up -d db`（seed投入済み）が前提。
// 期待値は docker/mysql/init/002_seed.sql から導出する。
// BIGINT の返却型が number/string どちらでも揺れないよう、比較前に文字列へ正規化する。
const orderIds = ["10001", "10002", "10003", "10004", "10005"];
const norm = (arr: unknown[]) => arr.map(String).sort();

describe("queries (integration / requires DB)", () => {
  it("fetchInvoiceIds: order_id から invoice_id を取得", async () => {
    const result = await fetchInvoiceIds(orderIds);
    expect(norm(result)).toEqual(["30001", "30002", "30003", "30004", "30005"]);
  });

  it("fetchSalesIds: order_id → order_detail → sales_id の多段lookup", async () => {
    const result = await fetchSalesIds(orderIds);
    expect(norm(result)).toEqual(["60001", "60002", "60003", "60004", "60005"]);
  });

  it("空配列はDBアクセスせず空を返す", async () => {
    expect(await fetchInvoiceIds([])).toEqual([]);
    expect(await fetchSalesIds([])).toEqual([]);
  });
});
