import { computeHabitStats, hasCheckIn } from "../domain/habits";
import type { AppData, DateKey, Habit } from "../domain/types";

interface TodayPanelProps {
  data: AppData;
  today: DateKey;
  selectedHabitId: string | null;
  onToggle: (habitId: string) => void;
  onSelect: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onAdd: () => void;
}

function HabitRow({
  habit,
  checked,
  streak,
  selected,
  onToggle,
  onSelect,
  onEdit,
}: {
  habit: Habit;
  checked: boolean;
  streak: number;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={`habit-row${checked ? " is-checked" : ""}${selected ? " is-selected" : ""}`}
      style={{ "--habit-color": habit.color } as React.CSSProperties}
    >
      <button
        type="button"
        className="habit-main"
        aria-pressed={checked}
        aria-label={`${habit.name}，${checked ? "已完成，点击取消" : "未完成，点击打卡"}`}
        onClick={() => {
          onSelect();
          onToggle();
        }}
      >
        <span className="habit-emoji" aria-hidden="true">
          {habit.emoji}
        </span>
        <span className="habit-copy">
          <span className="habit-name">{habit.name}</span>
          <span className="habit-meta">{streak > 0 ? `连续 ${streak} 天` : "从今天开始"}</span>
        </span>
        <span className="habit-check" aria-hidden="true">
          {checked ? "✓" : ""}
        </span>
      </button>
      <button type="button" className="icon-button habit-edit" aria-label={`编辑 ${habit.name}`} onClick={onEdit}>
        ⋯
      </button>
    </div>
  );
}

export function TodayPanel({
  data,
  today,
  selectedHabitId,
  onToggle,
  onSelect,
  onEdit,
  onAdd,
}: TodayPanelProps) {
  const activeHabits = data.habits
    .filter((habit) => habit.archivedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const done = activeHabits.filter((habit) => hasCheckIn(data, habit.id, today)).length;
  const progress = activeHabits.length === 0 ? 0 : (done / activeHabits.length) * 100;

  return (
    <section className="panel today-panel" aria-labelledby="today-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">今天</p>
          <h2 id="today-heading">今日打卡</h2>
        </div>
        <button type="button" className="add-button" onClick={onAdd}>
          <span aria-hidden="true">＋</span>
          添加习惯
        </button>
      </div>

      <div className="progress-card">
        <div className="progress-copy">
          <strong>
            {done}
            <span> / {activeHabits.length}</span>
          </strong>
          <span>{activeHabits.length === 0 ? "还没有习惯" : done === activeHabits.length ? "今天全部完成" : "完成一个，就离目标近一点"}</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {activeHabits.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">
            ☑
          </span>
          <h3>建立第一个习惯</h3>
          <p>每天勾一下，月历和连续天数会自动记录。</p>
          <button type="button" className="primary-button" onClick={onAdd}>
            添加第一个习惯
          </button>
        </div>
      ) : (
        <div className="habit-list">
          {activeHabits.map((habit) => {
            const stats = computeHabitStats(data, habit.id, today);
            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                checked={hasCheckIn(data, habit.id, today)}
                streak={stats.current}
                selected={selectedHabitId === habit.id}
                onToggle={() => onToggle(habit.id)}
                onSelect={() => onSelect(habit.id)}
                onEdit={() => onEdit(habit)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
