import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { createEmptyData } from "../domain/habits";
import type { AppData, Habit } from "../domain/types";
import type { HabitRepository } from "../storage/repository";
import { HabitDialog } from "./HabitDialog";
import { MonthCalendar } from "./MonthCalendar";
import { TodayPanel } from "./TodayPanel";

const habit: Habit = {
  id: "reading",
  name: "阅读",
  emoji: "📚",
  color: "#4f46e5",
  createdAt: "2026-01-01",
  archivedAt: null,
  sortOrder: 0,
};

function dataWith(dates: string[]): AppData {
  return {
    schemaVersion: 1,
    habits: [habit],
    checkIns: dates.map((date) => ({ habitId: habit.id, date, completedAt: `${date}T12:00:00.000Z` })),
  };
}

class FixedRepository implements HabitRepository {
  saved: AppData | null = null;

  constructor(private value: AppData) {}

  async load(): Promise<AppData> {
    return this.value;
  }

  async save(data: AppData): Promise<void> {
    this.saved = data;
    this.value = data;
  }
}

describe("habit UI", () => {
  it("toggles today's habit and displays the current streak", () => {
    const onToggle = vi.fn();
    render(
      <TodayPanel
        data={dataWith(["2026-10-04", "2026-10-03"])}
        today="2026-10-05"
        selectedHabitId={habit.id}
        onToggle={onToggle}
        onSelect={() => undefined}
        onEdit={() => undefined}
        onAdd={() => undefined}
      />,
    );

    expect(screen.getByText("连续 2 天")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "阅读，未完成，点击打卡" }));
    expect(onToggle).toHaveBeenCalledWith("reading");
  });

  it("allows past check-ins and disables future dates in the month view", () => {
    const onToggle = vi.fn();
    render(
      <MonthCalendar
        data={dataWith(["2026-10-04"])}
        habit={habit}
        today="2026-10-05"
        year={2026}
        monthIndex={9}
        stats={{ current: 1, longest: 1, total: 1 }}
        onPrevious={() => undefined}
        onNext={() => undefined}
        onToggle={onToggle}
      />,
    );

    const past = screen.getByRole("gridcell", { name: /2026-10-04/ });
    expect(past).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(past);
    expect(onToggle).toHaveBeenCalledWith("2026-10-04");

    expect(screen.getByRole("gridcell", { name: /2026-10-06/ })).toBeDisabled();
  });

  it("validates and submits the habit form", () => {
    const onSave = vi.fn();
    render(
      <HabitDialog open habit={null} onSave={onSave} onArchive={null} onClose={() => undefined} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("请输入习惯名称")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("习惯名称"), { target: { value: "晨跑" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSave).toHaveBeenCalledWith({ name: "晨跑", emoji: "✅", color: "#4f46e5" });
  });

  it("adds the first habit through the app flow", async () => {
    const repository = new FixedRepository(createEmptyData());
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: "添加第一个习惯" }));
    fireEvent.change(screen.getByLabelText("习惯名称"), { target: { value: "阅读" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(repository.saved?.habits[0]?.name).toBe("阅读"));
    expect(screen.getAllByText("阅读").length).toBeGreaterThan(0);
  });
});

