import { describe, it, expect } from "vitest";
import {
  getNextBusinessDay,
  addBusinessDays,
  formatDate,
  parseDate,
} from "./dateUtils.js";

describe("getNextBusinessDay", () => {
  it("営業日はそのまま返す", () => {
    const businessDay = parseDate("2026-07-02"); // 木曜
    const result = getNextBusinessDay(businessDay);
    expect(result).toEqual(parseDate("2026-07-02"));
  });
  it("週末は日付を進めて翌営業日を返す", () => {
    const weekend = parseDate("2026-07-05"); // 日曜
    const result = getNextBusinessDay(weekend);
    expect(result).toEqual(parseDate("2026-07-06"));
    expect(result.getDay()).toBe(1); // 月曜
  });
  it("祝日は日付を進めて翌営業日を返す", () => {
    const holiday = parseDate("2026-07-20"); // 月曜祝日（海の日）
    const result = getNextBusinessDay(holiday);
    expect(result).toEqual(parseDate("2026-07-21"));
    expect(result.getDay()).toBe(2); // 火曜
  });
});

describe("addBusinessDays", () => {
  it("加算後が営業日の場合そのまま返す", () => {
    const baseDate = parseDate("2026-07-02"); // 木曜
    const result = addBusinessDays(baseDate, 1);
    expect(result).toEqual(parseDate("2026-07-03")); // 金曜
  });
  it("加算後が週末の場合日付を進めて翌営業日を返す", () => {
    const baseDate = parseDate("2026-07-02"); // 木曜
    const result = addBusinessDays(baseDate, 2); // 加算後は土曜
    expect(result).toEqual(parseDate("2026-07-06")); // 月曜
  });
  it("加算後が祝日の場合日付を進めて翌営業日を返す", () => {
    const baseDate = parseDate("2026-07-02"); // 木曜
    const result = addBusinessDays(baseDate, 18); // 加算後は月曜祝日（海の日）
    expect(result).toEqual(parseDate("2026-07-21")); // 火曜
  });
});

describe("parseDate", () => {
  it("YYYY-MM-DD をローカルタイムの暦日0時として解釈する", () => {
    const result = parseDate("2026-07-01");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6); // 0始まりなので7月
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
  });
});

describe("formatDate", () => {
  it("日付をYYYY-MM-DD形式で返す", () => {
    const result = formatDate(parseDate("2026-07-15"));
    expect(result).toBe("2026-07-15");
  });
  it("月・日が1桁の場合もゼロ埋めして返す", () => {
    const result = formatDate(parseDate("2026-01-05"));
    expect(result).toBe("2026-01-05");
  });
});
