import { createEmptyData, normalizeData } from "../domain/habits";
import type { AppData } from "../domain/types";

export interface StorageAdapter {
  getData(key: string): Promise<string>;
  setData(key: string, value: string): Promise<void>;
}

export interface HabitRepository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

export const STORAGE_KEY = "habit-tracker-station-data-v1";

export class JsonHabitRepository implements HabitRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly adapter: StorageAdapter) {}

  async load(): Promise<AppData> {
    try {
      const raw = await this.adapter.getData(STORAGE_KEY);
      if (!raw) return createEmptyData();
      return normalizeData(JSON.parse(raw));
    } catch {
      return createEmptyData();
    }
  }

  save(data: AppData): Promise<void> {
    const snapshot = JSON.stringify(data);
    const write = this.writeQueue
      .catch(() => undefined)
      .then(() => this.adapter.setData(STORAGE_KEY, snapshot));

    this.writeQueue = write.catch(() => undefined);
    return write;
  }
}

