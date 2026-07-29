import { describe, it, expect } from "vitest";
import { parseCsv, renderTemplate, buildUpdateVars } from "./csvToSql.js";
import { parseDate } from "./dateUtils.js";

describe("parseCsv", () => {
  const header = `col_1,col_2,col_3`;
  const parse1Row = (row: string) => `${header}\n${row}`;
  it("文字列はそのまま返す", () => {
    expect(parseCsv(parse1Row("foo,bar,baz"))).toEqual([
      {
        col_1: "foo",
        col_2: "bar",
        col_3: "baz",
      },
    ]);
  });
  it("数値も文字列として返す", () => {
    expect(parseCsv(parse1Row("1,2,3"))).toEqual([
      {
        col_1: "1",
        col_2: "2",
        col_3: "3",
      },
    ]);
  });
  it("空は空文字として返す", () => {
    expect(parseCsv(parse1Row(",,"))).toEqual([
      {
        col_1: "",
        col_2: "",
        col_3: "",
      },
    ]);
  });
  it("nullという文字列はそのまま返す", () => {
    expect(parseCsv(parse1Row("null,NULL,Null"))).toEqual([
      {
        col_1: "null",
        col_2: "NULL",
        col_3: "Null",
      },
    ]);
  });
  it("データ行が0件の場合エラーを投げる", () => {
    expect(() => parseCsv(header)).toThrow(
      "CSVに処理対象のデータがありません",
    );
  });
});


describe("buildUpdateVars", () => {
  const rows = [
    { order_id: "10001", shipping_id: "20001" },
    { order_id: "10002", shipping_id: "20002" },
  ];
  const userId = 1018;
  const baseDate = parseDate("2026-07-01"); // 水曜
  const invoiceIds = ["30001", "30002"];

  it("shippingIdsがCSVの行データからカンマ区切りで生成される", () => {
    const result = buildUpdateVars(rows, userId, baseDate, invoiceIds);
    expect(result.shippingIds).toBe("20001,20002");
  });
  it("invoiceIdsが引数からカンマ区切りで生成される", () => {
    const result = buildUpdateVars(rows, userId, baseDate, invoiceIds);
    expect(result.invoiceIds).toBe("30001,30002");
  });
  it("userIdが文字列に変換されて設定される", () => {
    const result = buildUpdateVars(rows, userId, baseDate, invoiceIds);
    expect(result.userId).toBe("1018");
  });
  it("baseDateがYYYY-MM-DD形式で設定される", () => {
    const result = buildUpdateVars(rows, userId, baseDate, invoiceIds);
    expect(result.baseDate).toBe("2026-07-01");
  });
  it("newDepositDueDateが翌月初の14日後の翌営業日になる（土日は繰り上げ）", () => {
    const result = buildUpdateVars(rows, userId, baseDate, invoiceIds);
    // 翌月初=2026-08-01, +14日=2026-08-15(土) → 翌営業日 2026-08-17(月)
    expect(result.newDepositDueDate).toBe("2026-08-17");
  });
  it("newDepositGraceDateはnewDepositDueDateと同日になる", () => {
    const result = buildUpdateVars(rows, userId, baseDate, invoiceIds);
    expect(result.newDepositGraceDate).toBe(result.newDepositDueDate);
    expect(result.newDepositGraceDate).toBe("2026-08-17");
  });
  it("14日後が営業日ならその日付になる（繰り上げなし）", () => {
    const baseDateWeekday = parseDate("2026-06-01"); // 翌月初=2026-07-01, +14日=2026-07-15(水)
    const result = buildUpdateVars(rows, userId, baseDateWeekday, invoiceIds);
    expect(result.newDepositDueDate).toBe("2026-07-15");
  });
});

describe("renderTemplate", () => {
  it("置換リストにマッチするプレースホルダーを置換する", () => {
    const template = `{{target}}`;
    const vars = {
      target: "replaced",
    };
    const result = renderTemplate(template, vars);
    expect(result).contain("replaced");
  });
  it("未置換のプレースホルダーがある場合エラーを投げる", () => {
    const template = `{{target}}`;
    const vars = { notTarget: "replaced" };
    expect(() => renderTemplate(template, vars)).toThrow(
      "未置換のプレースホルダーがあります: {{target}}",
    );
  });
  it("複数の同じプレースホルダーが全て置換される", () => {
    const template = `{{target}}\n{{target}}\n`;
    const vars = {
      target: "replaced",
    };
    const result = renderTemplate(template, vars);
    expect(result).toBe("replaced\nreplaced\n");
    expect(result).not.toContain("{{target}}");
  });
  it("プレースホルダーの大文字小文字を区別する", () => {
    const template = `{{target}} {{Target}}`;
    const vars = { target: "replaced" };
    expect(() => renderTemplate(template, vars)).toThrow(
      "未置換のプレースホルダーがあります: {{Target}}",
    );
  });
});
