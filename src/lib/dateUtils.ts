import { isHoliday } from "jp-holidays";

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isNonBusinessDay(date: Date): boolean {
  return isWeekend(date) || isHoliday(date);
}

/**
 * 指定した日付が営業日でない場合、翌営業日を返す。
 * 土日・日本の祝日を非営業日として扱う。
 * @param date - 起点となる日付
 * @returns 営業日（土日祝でなければそのまま返す）
 */
export function getNextBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (isNonBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/**
 * 指定した日数を加算し、結果が非営業日であれば翌営業日を返す。
 * @param baseDate - 起点となる日付
 * @param days - 加算する日数
 * @returns 加算後の翌営業日
 */
export function addBusinessDays(baseDate: Date, days: number): Date {
  const candidate = new Date(baseDate);
  candidate.setDate(candidate.getDate() + days);
  return getNextBusinessDay(candidate);
}

/**
 * "YYYY-MM-DD" 文字列を、その暦日の 0 時（ローカルタイム）として解釈した Date を返す。
 * このプロジェクトの日付は時刻・TZの概念を持たない「日付リテラル」であり、
 * 祝日判定（jp-holidays）や営業日計算がローカル系メソッドで日付を読むため、
 * UTC解釈になる `new Date("YYYY-MM-DD")` ではなくローカルで構築して系統を揃える。
 * @param str - "YYYY-MM-DD" 形式の日付文字列
 * @returns ローカルタイムでその暦日の 0 時を指す Date
 */
export function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Date を YYYY-MM-DD 形式の文字列に変換する。
 * ローカルの暦日（getFullYear/getMonth/getDate）をそのまま文字列化する。
 * toISOString はUTC基準でズレるため使わない（日付リテラルとして扱うため）。
 * @param date - フォーマット対象の日付
 * @returns YYYY-MM-DD 形式の文字列
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
