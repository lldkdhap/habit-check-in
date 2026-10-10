import type { DateKey } from "./types";

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface CalendarCell {
  date: DateKey | null;
  day: number | null;
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function dateKeyFromParts(year: number, month: number, day: number): DateKey {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function toDateKey(date: Date): DateKey {
  return dateKeyFromParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function parseDateKey(value: string): DateParts | null {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const jsDate = new Date(year, month - 1, day);

  if (
    jsDate.getFullYear() !== year ||
    jsDate.getMonth() !== month - 1 ||
    jsDate.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isValidDateKey(value: unknown): value is DateKey {
  return typeof value === "string" && parseDateKey(value) !== null;
}

export function addDays(date: DateKey, offset: number): DateKey {
  const parts = parseDateKey(date);
  if (!parts) throw new Error(`Invalid date key: ${date}`);

  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
  return dateKeyFromParts(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

export function daysBetween(later: DateKey, earlier: DateKey): number {
  const laterParts = parseDateKey(later);
  const earlierParts = parseDateKey(earlier);
  if (!laterParts || !earlierParts) {
    throw new Error(`Invalid date key comparison: ${later}, ${earlier}`);
  }

  const laterUtc = Date.UTC(laterParts.year, laterParts.month - 1, laterParts.day);
  const earlierUtc = Date.UTC(earlierParts.year, earlierParts.month - 1, earlierParts.day);
  return Math.round((laterUtc - earlierUtc) / DAY_MS);
}

export function formatChineseFullDate(date: DateKey): string {
  const parts = parseDateKey(date);
  if (!parts) return date;

  return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function formatChineseMonth(year: number, monthIndex: number): string {
  return `${year} 年 ${monthIndex + 1} 月`;
}

export function getMonthLabelParts(year: number, monthIndex: number): { year: number; month: number } {
  const date = new Date(year, monthIndex, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const leadingEmpty = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    cells.push({ date: null, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: dateKeyFromParts(year, monthIndex + 1, day), day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null });
  }

  while (cells.length < 42) {
    cells.push({ date: null, day: null });
  }

  return cells;
}

export function shiftMonth(year: number, monthIndex: number, offset: number): { year: number; month: number } {
  const shifted = new Date(year, monthIndex + offset, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}
