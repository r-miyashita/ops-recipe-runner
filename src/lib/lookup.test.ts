import { describe, it, expect } from "vitest";
import { isValidIdentifier, parseFilter } from "./lookup.js";

describe("isValidIdentifier", () => {
  it("英数字とアンダースコアのみの識別子を許可する", () => {
    expect(isValidIdentifier("t_order")).toBe(true);
    expect(isValidIdentifier("order_id")).toBe(true);
    expect(isValidIdentifier("_private")).toBe(true);
  });
  it("バッククォートや空白を含む文字列を拒否する", () => {
    expect(isValidIdentifier("t_order`; DROP TABLE t_order; --")).toBe(false);
    expect(isValidIdentifier("t order")).toBe(false);
  });
  it("数字始まりを拒否する", () => {
    expect(isValidIdentifier("1table")).toBe(false);
  });
  it("空文字を拒否する", () => {
    expect(isValidIdentifier("")).toBe(false);
  });
});

describe("parseFilter", () => {
  it("列名=数値リテラルを解析する", () => {
    expect(parseFilter("logical_delete_flag = 0")).toEqual({
      column: "logical_delete_flag",
      literal: "0",
    });
  });
  it("列名=文字列リテラルを解析する", () => {
    expect(parseFilter("status = 'shipped'")).toEqual({
      column: "status",
      literal: "'shipped'",
    });
  });
  it("自由記述のSQL断片は拒否する", () => {
    expect(parseFilter("1=1 OR 1=1")).toBeNull();
    expect(parseFilter("logical_delete_flag = 0 OR 1=1")).toBeNull();
    expect(parseFilter("logical_delete_flag != 0")).toBeNull();
  });
});
