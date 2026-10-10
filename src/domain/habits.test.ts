import { describe, expect, it } from "vitest";
import {
  addHabit,
  archiveHabit,
  computeHabitStats,
  createEmptyData,
  getActiveHabits,
  toggleCheckIn,
  updateHabit,
  validateHabitName,
} from "./habits";
import type { AppData, Habit } from "./types";

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "reading",
    name: "阅读",
    emoji: "📚",
    color: "#4f46e5",
    createdAt: "2026-01-01",
    archivedAt: null,
    sortOrder: 0,
    ...overrides,
  };
}

function withChecks(dates: string[], habitId = "reading"): AppData {
  return {
    schemaVersion: 1,
    habits: [habit({ id: habitId })],
    checkIns: dates.map((date) => ({ habitId, date, completedAt: `${date}T12:00:00.000Z` })),
  };
}

describe("habit domain", () => {
  it("keeps yesterday's streak while today is still open", () => {
    const stats = computeHabitStats(withChecks(["2026-10-04", "2026-10-03"]), "reading", "2026-10-05");
    expect(stats.current).toBe(2);
  });

  it("extends the streak after today's check-in", () => {
    const stats = computeHabitStats(
      withChecks(["2026-10-05", "2026-10-04", "2026-10-03"]),
      "reading",
      "2026-10-05",
    );
    expect(stats.current).toBe(3);
  });

  it("breaks a streak on a missing calendar day", () => {
    const stats = computeHabitStats(withChecks(["2026-10-05", "2026-10-03"]), "reading", "2026-10-05");
    expect(stats.current).toBe(1);
  });

  it("recomputes after a retroactive uncheck", () => {
    const original = withChecks(["2026-10-05", "2026-10-04", "2026-10-03"]);
    const changed = toggleCheckIn(original, "reading", "2026-10-04");
    expect(computeHabitStats(changed, "reading", "2026-10-05")).toEqual({
      current: 1,
      longest: 1,
      total: 2,
    });
  });

  it("finds the longest streak and ignores future check-ins", () => {
    const stats = computeHabitStats(
      withChecks(["2026-09-01", "2026-09-02", "2026-09-03", "2026-10-01", "2026-12-01"]),
      "reading",
      "2026-10-05",
    );
    expect(stats.longest).toBe(3);
    expect(stats.total).toBe(4);
  });

  it("counts retroactive check-ins before the habit creation date", () => {
    const data = withChecks(["2026-10-04", "2026-10-05"]);
    expect(computeHabitStats(data, "reading", "2026-10-05")).toEqual({
      current: 2,
      longest: 2,
      total: 2,
    });
  });
  it("keeps habits independent", () => {
    const data: AppData = {
      schemaVersion: 1,
      habits: [habit({ id: "reading" }), habit({ id: "water", name: "喝水", sortOrder: 1 })],
      checkIns: [
        { habitId: "reading", date: "2026-10-05", completedAt: "2026-10-05T00:00:00.000Z" },
        { habitId: "water", date: "2026-10-04", completedAt: "2026-10-04T00:00:00.000Z" },
      ],
    };

    expect(computeHabitStats(data, "reading", "2026-10-05").current).toBe(1);
    expect(computeHabitStats(data, "water", "2026-10-05").current).toBe(1);
  });

  it("creates, edits and archives habits without deleting history", () => {
    const created = addHabit(createEmptyData(), { name: " 跑步 ", emoji: "🏃", color: "#059669" }, "2026-10-05");
    const habitId = created.habits[0].id;
    expect(created.habits[0].name).toBe("跑步");

    const edited = updateHabit(created, habitId, { name: "晨跑", emoji: "🏃", color: "#2563eb" });
    expect(edited.habits[0].name).toBe("晨跑");

    const withHistory = toggleCheckIn(edited, habitId, "2026-10-05");
    const archived = archiveHabit(withHistory, habitId, "2026-10-05T12:00:00.000Z");
    expect(getActiveHabits(archived)).toHaveLength(0);
    expect(archived.checkIns).toHaveLength(1);
  });

  it("validates names", () => {
    expect(validateHabitName("   ")).toBe("请输入习惯名称");
    expect(validateHabitName("a".repeat(25))).toBe("习惯名称不能超过 24 个字符");
    expect(validateHabitName("阅读")).toBeNull();
  });
});

