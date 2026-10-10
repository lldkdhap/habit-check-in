import { JsonHabitRepository, type StorageAdapter } from "./repository";

const adapter: StorageAdapter = {
  async getData(key) {
    const value = window.localStorage.getItem(key);
    if (value === null) throw new Error("missing browser storage value");
    return value;
  },
  async setData(key, value) {
    window.localStorage.setItem(key, value);
  },
};

export const browserHabitRepository = new JsonHabitRepository(adapter);
