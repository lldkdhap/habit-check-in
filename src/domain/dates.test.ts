import { describe, expect, it } from "vitest";
import { addDays, buildMonthGrid, daysBetween, isValidDateKey, toDateKey } from "./dates";

describe("date helpers", () => {
  it("uses local calendar dates instead of UTC timestamps", () => {
    expect(toDateKey(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("calculates exact calendar-day differences", () => {
    expect(daysBetween("2026-10-05", "2026-10-04")).toBe(1);
    expect(daysBetween("2026-03-01", "2026-02-28")).toBe(1);
  });

  it("rejects impossible date keys", () => {
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("2028-02-29")).toBe(true);
    expect(isValidDateKey("2026-13-01")).toBe(false);
  });

  it("builds a Monday-first calendar with stable six-week height", () => {
    const grid = buildMonthGrid(2026, 9);
    expect(grid).toHaveLength(42);
    expect(grid[0].date).toBeNull();
    expect(grid.find((cell) => cell.date === "2026-10-01")?.day).toBe(1);
    expect(grid.find((cell) => cell.date === "2026-10-31")?.day).toBe(31);
  });
});
