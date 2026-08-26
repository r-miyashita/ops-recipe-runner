import { describe, it, expect } from "vitest";
import { parseCsv, extractColumn, parseCsvFilter, filterRows } from "./csv.js";

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

describe("extractColumn", () => {
  const rows = [
    { order_id: "10001", shipping_id: "20001" },
    { order_id: "10002", shipping_id: "20002" },
    { order_id: "10003", shipping_id: "20003" },
  ];
  it("指定列の値をカンマ区切りで返す", () => {
    expect(extractColumn(rows, "order_id")).toBe("10001,10002,10003");
  });
  it("存在しない列を指定するとエラーを投げる", () => {
    expect(() => extractColumn(rows, "unknown")).toThrow(
      '列 "unknown" が見つかりません',
    );
  });
});

describe("parseCsvFilter", () => {
  it("列名 = 値を解析する", () => {
    expect(parseCsvFilter("status = shipped")).toEqual({
      column: "status",
      value: "shipped",
    });
  });
  it("日本語の列名・値も解析する", () => {
    expect(parseCsvFilter("ステータス = 出荷済み")).toEqual({
      column: "ステータス",
      value: "出荷済み",
    });
  });
  it("=を含まない文字列は拒否する", () => {
    expect(parseCsvFilter("status shipped")).toBeNull();
  });
});

describe("filterRows", () => {
  const rows = [
    { order_id: "10001", status: "shipped" },
    { order_id: "10002", status: "pending" },
    { order_id: "10003", status: "shipped" },
  ];
  it("列名 = 値に一致する行だけを返す", () => {
    expect(filterRows(rows, "status = shipped")).toEqual([
      { order_id: "10001", status: "shipped" },
      { order_id: "10003", status: "shipped" },
    ]);
  });
  it("一致する行が無ければ空配列を返す", () => {
    expect(filterRows(rows, "status = cancelled")).toEqual([]);
  });
  it("不正な形式のfilterはエラーを投げる", () => {
    expect(() => filterRows(rows, "status shipped")).toThrow(
      'filterは "列名 = 値" 形式のみ許可します',
    );
  });
  it("存在しない列を指定するとエラーを投げる", () => {
    expect(() => filterRows(rows, "unknown = x")).toThrow(
      '列 "unknown" が見つかりません',
    );
  });
});
