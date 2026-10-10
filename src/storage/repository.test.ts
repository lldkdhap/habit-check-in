import { describe, expect, it } from "vitest";
import { JsonHabitRepository, STORAGE_KEY, type StorageAdapter } from "./repository";
import { createEmptyData } from "../domain/habits";
import type { AppData } from "../domain/types";

class MemoryStorage implements StorageAdapter {
  value: string | null = null;
  writes: string[] = [];
  delayMs = 0;

  async getData(): Promise<string> {
    if (this.value === null) throw new Error("missing");
    return this.value;
  }

  async setData(_key: string, value: string): Promise<void> {
    if (this.delayMs) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    this.value = value;
    this.writes.push(value);
  }
}

const sample: AppData = {
  schemaVersion: 1,
  habits: [
    {
      id: "reading",
      name: "阅读",
      emoji: "📚",
      color: "#4f46e5",
      createdAt: "2026-10-05",
      archivedAt: null,
      sortOrder: 0,
    },
  ],
  checkIns: [{ habitId: "reading", date: "2026-10-05", completedAt: "2026-10-05T12:00:00.000Z" }],
};

describe("Neutralino storage key", () => {
  it("uses only characters accepted by Neutralino", () => {
    expect(STORAGE_KEY).toMatch(/^[a-zA-Z-_0-9]{1,50}$/);
  });
});
describe("JsonHabitRepository", () => {
  it("returns empty data when the storage key is missing", async () => {
    const repository = new JsonHabitRepository(new MemoryStorage());
    expect(await repository.load()).toEqual(createEmptyData());
  });

  it("returns empty data for malformed JSON", async () => {
    const storage = new MemoryStorage();
    storage.value = "{not-json";
    const repository = new JsonHabitRepository(storage);
    expect(await repository.load()).toEqual(createEmptyData());
  });

  it("round-trips valid data", async () => {
    const storage = new MemoryStorage();
    const repository = new JsonHabitRepository(storage);
    await repository.save(sample);
    expect(await repository.load()).toEqual(sample);
  });

  it("serializes rapid writes so the latest state is persisted last", async () => {
    const storage = new MemoryStorage();
    storage.delayMs = 5;
    const repository = new JsonHabitRepository(storage);
    const second = { ...sample, checkIns: [...sample.checkIns, { habitId: "reading", date: "2026-10-06", completedAt: "x" }] };

    const firstWrite = repository.save(sample);
    const secondWrite = repository.save(second);
    await Promise.all([firstWrite, secondWrite]);

    expect(storage.writes).toHaveLength(2);
    expect(JSON.parse(storage.writes.at(-1) as string)).toEqual(second);
  });
});

