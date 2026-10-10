import { useEffect, useMemo, useState } from "react";
import { HabitDialog } from "./components/HabitDialog";
import { MonthCalendar } from "./components/MonthCalendar";
import { TodayPanel } from "./components/TodayPanel";
import { formatChineseFullDate, shiftMonth, todayKey } from "./domain/dates";
import {
  addHabit,
  archiveHabit,
  computeHabitStats,
  getActiveHabits,
  toggleCheckIn,
  updateHabit,
} from "./domain/habits";
import type { AppData, DateKey, Habit, HabitInput } from "./domain/types";
import type { HabitRepository } from "./storage/repository";

interface AppProps {
  repository: HabitRepository;
}

function useToday(): DateKey {
  const [today, setToday] = useState<DateKey>(() => todayKey());

  useEffect(() => {
    function syncToday() {
      setToday(todayKey());
    }

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 50);
    const timer = window.setTimeout(syncToday, nextMidnight.getTime() - now.getTime());

    window.addEventListener("focus", syncToday);
    document.addEventListener("visibilitychange", syncToday);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", syncToday);
      document.removeEventListener("visibilitychange", syncToday);
    };
  }, [today]);

  return today;
}

export default function App({ repository }: AppProps) {
  const today = useToday();
  const [data, setData] = useState<AppData | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(() => {
    const parts = today.split("-").map(Number);
    return { year: parts[0], month: parts[1] - 1 };
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    repository
      .load()
      .then((loaded) => {
        if (!active) return;
        setData(loaded);
        const firstHabit = getActiveHabits(loaded)[0];
        setSelectedHabitId(firstHabit?.id ?? null);
      })
      .catch(() => {
        if (active) setSaveError("读取本地数据失败，本次修改可能无法保存。");
      });

    return () => {
      active = false;
    };
  }, [repository]);

  const activeHabits = useMemo(() => (data ? getActiveHabits(data) : []), [data]);
  const selectedHabit = useMemo(() => {
    if (!data) return null;
    return activeHabits.find((habit) => habit.id === selectedHabitId) ?? activeHabits[0] ?? null;
  }, [activeHabits, data, selectedHabitId]);
  const selectedStats = useMemo(
    () => (data && selectedHabit ? computeHabitStats(data, selectedHabit.id, today) : null),
    [data, selectedHabit, today],
  );
  const editingHabit = data?.habits.find((habit) => habit.id === editingHabitId) ?? null;

  async function commit(nextData: AppData) {
    setData(nextData);
    try {
      await repository.save(nextData);
      setSaveError(null);
    } catch {
      setSaveError("保存失败，请稍后重试。当前操作会保留在这次运行中。");
    }
  }

  function openAddDialog() {
    setEditingHabitId(null);
    setDialogOpen(true);
  }

  function openEditDialog(habit: Habit) {
    setEditingHabitId(habit.id);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingHabitId(null);
  }

  function handleSaveHabit(input: HabitInput) {
    if (!data) return;

    if (editingHabitId) {
      void commit(updateHabit(data, editingHabitId, input));
    } else {
      const next = addHabit(data, input, today);
      const createdHabit = next.habits[next.habits.length - 1];
      setSelectedHabitId(createdHabit.id);
      void commit(next);
    }

    closeDialog();
  }

  function handleArchiveHabit() {
    if (!data || !editingHabitId) return;
    const confirmed = window.confirm("删除后会从列表隐藏，但历史打卡记录会保留。确定删除吗？");
    if (!confirmed) return;

    const next = archiveHabit(data, editingHabitId);
    const nextActive = getActiveHabits(next);
    setSelectedHabitId(nextActive[0]?.id ?? null);
    void commit(next);
    closeDialog();
  }

  function handleToggleToday(habitId: string) {
    if (!data) return;
    void commit(toggleCheckIn(data, habitId, today));
  }

  function handleToggleCalendar(date: DateKey) {
    if (!data || !selectedHabit || date > today) return;
    void commit(toggleCheckIn(data, selectedHabit.id, date));
  }

  if (!data) {
    return (
      <main className="loading-screen">
        <div className="loading-mark" aria-hidden="true">
          ✓
        </div>
        <p>正在加载本地数据…</p>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ✓
          </span>
          <div>
            <h1>习惯打卡站</h1>
            <p>{formatChineseFullDate(today)}</p>
          </div>
        </div>
        <span className="offline-badge">
          <i aria-hidden="true" />
          本地离线
        </span>
      </header>

      {saveError && (
        <div className="error-banner" role="alert">
          {saveError}
        </div>
      )}

      <main className="workspace">
        <TodayPanel
          data={data}
          today={today}
          selectedHabitId={selectedHabit?.id ?? null}
          onToggle={handleToggleToday}
          onSelect={setSelectedHabitId}
          onEdit={openEditDialog}
          onAdd={openAddDialog}
        />

        {selectedHabit && selectedStats ? (
          <MonthCalendar
            data={data}
            habit={selectedHabit}
            today={today}
            year={calendar.year}
            monthIndex={calendar.month}
            stats={selectedStats}
            onPrevious={() => setCalendar((current) => shiftMonth(current.year, current.month, -1))}
            onNext={() => setCalendar((current) => shiftMonth(current.year, current.month, 1))}
            onToggle={handleToggleCalendar}
          />
        ) : (
          <section className="panel calendar-panel calendar-empty">
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">▦</span>
              <h2>月历等待第一个习惯</h2>
              <p>添加习惯后，这里会显示每天的历史打卡。</p>
            </div>
          </section>
        )}
      </main>

      <HabitDialog
        open={dialogOpen}
        habit={editingHabit}
        onSave={handleSaveHabit}
        onArchive={editingHabit ? handleArchiveHabit : null}
        onClose={closeDialog}
      />
    </div>
  );
}
