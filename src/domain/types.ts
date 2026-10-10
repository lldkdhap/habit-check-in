export type DateKey = string;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: DateKey;
  archivedAt: string | null;
  sortOrder: number;
}

export interface CheckIn {
  habitId: string;
  date: DateKey;
  completedAt: string;
}

export interface AppData {
  schemaVersion: 1;
  habits: Habit[];
  checkIns: CheckIn[];
}

export interface HabitInput {
  name: string;
  emoji: string;
  color: string;
}

export interface HabitStats {
  current: number;
  longest: number;
  total: number;
}
