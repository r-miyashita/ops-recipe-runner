import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv.js";

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
