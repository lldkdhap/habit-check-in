import { storage } from "@neutralinojs/lib";
import { JsonHabitRepository, type StorageAdapter } from "./repository";

const adapter: StorageAdapter = {
  getData: (key) => storage.getData(key),
  setData: (key, value) => storage.setData(key, value),
};

export const habitRepository = new JsonHabitRepository(adapter);
