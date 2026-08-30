import { describe, it, expect } from "vitest";
import { runLookupSteps } from "./lookup.js";

// 結合テスト（DB依存）。`docker compose up -d db`（seed投入済み）が前提。
// 期待値は docker/mysql/init/default/002_seed.sql から導出する。
const orderIds = ["10001", "10002", "10003", "10004", "10005"];
const norm = (arr: string[]) => [...arr].sort();

describe("runLookupSteps (integration / requires DB)", () => {
  it("単段: 受注IDから請求書IDを取得", async () => {
    const result = await runLookupSteps(
      [
        {
          from: "t_order",
          select: "invoice_id",
          key: "order_id",
          filters: ["logical_delete_flag = 0"],
        },
      ],
      orderIds,
    );
    expect(norm(result)).toEqual([
      "30001",
      "30002",
      "30003",
      "30004",
      "30005",
    ]);
  });

  it("多段: 受注ID → order_detail_id → sales_id", async () => {
    const result = await runLookupSteps(
      [
        {
          from: "t_order_detail",
          select: "order_detail_id",
          key: "order_id",
          filters: ["logical_delete_flag = 0"],
        },
        {
          from: "t_sales",
          select: "sales_id",
          key: "order_detail_id",
          filters: ["logical_delete_flag = 0"],
        },
      ],
      orderIds,
    );
    expect(norm(result)).toEqual([
      "60001",
      "60002",
      "60003",
      "60004",
      "60005",
    ]);
  });

  it("存在しないテーブルを指定するとエラーを投げる", async () => {
    await expect(
      runLookupSteps(
        [{ from: "t_not_exist", select: "x", key: "y" }],
        orderIds,
      ),
    ).rejects.toThrow("テーブルが実スキーマに存在しません");
  });

  it("存在しない列を指定するとエラーを投げる", async () => {
    await expect(
      runLookupSteps(
        [{ from: "t_order", select: "not_a_column", key: "order_id" }],
        orderIds,
      ),
    ).rejects.toThrow("列が存在しません");
  });

  it("空のinitialIdsはDBアクセスせず空を返す", async () => {
    expect(
      await runLookupSteps(
        [{ from: "t_order", select: "invoice_id", key: "order_id" }],
        [],
      ),
    ).toEqual([]);
  });
});
