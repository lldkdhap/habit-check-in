import { addDays, daysBetween, isValidDateKey, todayKey } from "./dates";
import type { AppData, CheckIn, DateKey, Habit, HabitInput, HabitStats } from "./types";

export const COLOR_PRESETS = [
  "#4f46e5",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#d97706",
  "#dc2626",
  "#db2777",
] as const;

export const EMOJI_PRESETS = ["✅", "📚", "🏃", "💧", "🧘", "🌙", "💪", "✍️", "🥗", "🎯"] as const;

export function createEmptyData(): AppData {
  return {
    schemaVersion: 1,
    habits: [],
    checkIns: [],
  };
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function validateHabitName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "请输入习惯名称";
  if (Array.from(trimmed).length > 24) return "习惯名称不能超过 24 个字符";
  return null;
}

export function normalizeData(value: unknown): AppData {
  if (!value || typeof value !== "object") return createEmptyData();

  const candidate = value as { habits?: unknown; checkIns?: unknown };
  if (!Array.isArray(candidate.habits) || !Array.isArray(candidate.checkIns)) {
    return createEmptyData();
  }

  const habits: Habit[] = candidate.habits
    .filter((item) => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const source = item as Partial<Habit>;
      const createdAt = isValidDateKey(source.createdAt) ? source.createdAt : todayKey();
      const name = typeof source.name === "string" ? source.name.trim().slice(0, 24) : "";
      if (!name || typeof source.id !== "string") return null;

      return {
        id: source.id,
        name,
        emoji: typeof source.emoji === "string" && source.emoji ? Array.from(source.emoji)[0] : "✅",
        color: typeof source.color === "string" && source.color ? source.color : COLOR_PRESETS[0],
        createdAt,
        archivedAt: typeof source.archivedAt === "string" ? source.archivedAt : null,
        sortOrder: Number.isFinite(source.sortOrder) ? Number(source.sortOrder) : index,
      };
    })
    .filter((habit): habit is Habit => habit !== null);

  const habitIds = new Set(habits.map((habit) => habit.id));
  const seenCheckIns = new Set<string>();
  const checkIns: CheckIn[] = candidate.checkIns
    .filter((item) => Boolean(item) && typeof item === "object")
    .map((item) => {
      const source = item as Partial<CheckIn>;
      if (
        typeof source.habitId !== "string" ||
        !habitIds.has(source.habitId) ||
        !isValidDateKey(source.date)
      ) {
        return null;
      }

      const key = `${source.habitId}:${source.date}`;
      if (seenCheckIns.has(key)) return null;
      seenCheckIns.add(key);

      return {
        habitId: source.habitId,
        date: source.date,
        completedAt:
          typeof source.completedAt === "string" ? source.completedAt : new Date().toISOString(),
      };
    })
    .filter((checkIn): checkIn is CheckIn => checkIn !== null);

  return {
    schemaVersion: 1,
    habits: habits.sort((a, b) => a.sortOrder - b.sortOrder),
    checkIns,
  };
}

export function getActiveHabits(data: AppData): Habit[] {
  return data.habits
    .filter((habit) => habit.archivedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function addHabit(data: AppData, input: HabitInput, date = todayKey()): AppData {
  const maxOrder = data.habits.reduce((max, habit) => Math.max(max, habit.sortOrder), -1);
  const habit: Habit = {
    id: createId(),
    name: input.name.trim(),
    emoji: Array.from(input.emoji || "✅")[0],
    color: input.color,
    createdAt: date,
    archivedAt: null,
    sortOrder: maxOrder + 1,
  };

  return { ...data, habits: [...data.habits, habit] };
}

export function updateHabit(data: AppData, habitId: string, input: HabitInput): AppData {
  return {
    ...data,
    habits: data.habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            name: input.name.trim(),
            emoji: Array.from(input.emoji || "✅")[0],
            color: input.color,
          }
        : habit,
    ),
  };
}

export function archiveHabit(data: AppData, habitId: string, archivedAt = new Date().toISOString()): AppData {
  return {
    ...data,
    habits: data.habits.map((habit) =>
      habit.id === habitId ? { ...habit, archivedAt } : habit,
    ),
  };
}

export function hasCheckIn(data: AppData, habitId: string, date: DateKey): boolean {
  return data.checkIns.some((checkIn) => checkIn.habitId === habitId && checkIn.date === date);
}

export function getCheckInDates(data: AppData, habitId: string): Set<DateKey> {
  return new Set(
    data.checkIns
      .filter((checkIn) => checkIn.habitId === habitId)
      .map((checkIn) => checkIn.date),
  );
}

export function toggleCheckIn(data: AppData, habitId: string, date: DateKey): AppData {
  const existing = hasCheckIn(data, habitId, date);
  if (existing) {
    return {
      ...data,
      checkIns: data.checkIns.filter(
        (checkIn) => !(checkIn.habitId === habitId && checkIn.date === date),
      ),
    };
  }

  return {
    ...data,
    checkIns: [
      ...data.checkIns,
      {
        habitId,
        date,
        completedAt: new Date().toISOString(),
      },
    ],
  };
}

export function computeHabitStats(
  data: AppData,
  habitId: string,
  today: DateKey = todayKey(),
): HabitStats {
  const habit = data.habits.find((item) => item.id === habitId);
  if (!habit) return { current: 0, longest: 0, total: 0 };

  const dates = Array.from(getCheckInDates(data, habitId))
    .filter((date) => date <= today)
    .sort();

  let cursor = dates.includes(today) ? today : addDays(today, -1);
  let current = 0;
  const dateSet = new Set(dates);

  while (dateSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let running = 0;
  let previous: DateKey | null = null;

  for (const date of dates) {
    running = previous && daysBetween(date, previous) === 1 ? running + 1 : 1;
    longest = Math.max(longest, running);
    previous = date;
  }

  return { current, longest, total: dates.length };
}

