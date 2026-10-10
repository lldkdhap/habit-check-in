import {
  buildMonthGrid,
  formatChineseMonth,
  getWeekdayLabels,
} from "../domain/dates";
import { getCheckInDates } from "../domain/habits";
import type { AppData, DateKey, Habit, HabitStats } from "../domain/types";

interface MonthCalendarProps {
  data: AppData;
  habit: Habit;
  today: DateKey;
  year: number;
  monthIndex: number;
  stats: HabitStats;
  onPrevious: () => void;
  onNext: () => void;
  onToggle: (date: DateKey) => void;
}

export function MonthCalendar({
  data,
  habit,
  today,
  year,
  monthIndex,
  stats,
  onPrevious,
  onNext,
  onToggle,
}: MonthCalendarProps) {
  const cells = buildMonthGrid(year, monthIndex);
  const checkedDates = getCheckInDates(data, habit.id);

  return (
    <section className="panel calendar-panel" aria-labelledby="calendar-heading">
      <div className="calendar-header">
        <div>
          <p className="eyebrow">历史记录</p>
          <h2 id="calendar-heading">{habit.name}</h2>
        </div>
        <div className="month-navigation" aria-label="月份切换">
          <button type="button" className="icon-button" aria-label="上个月" onClick={onPrevious}>
            ‹
          </button>
          <strong>{formatChineseMonth(year, monthIndex)}</strong>
          <button type="button" className="icon-button" aria-label="下个月" onClick={onNext}>
            ›
          </button>
        </div>
      </div>

      <div className="stats-row" aria-label={`${habit.name}统计`}>
        <div>
          <span>当前连续</span>
          <strong>{stats.current} 天</strong>
        </div>
        <div>
          <span>最长连续</span>
          <strong>{stats.longest} 天</strong>
        </div>
        <div>
          <span>累计打卡</span>
          <strong>{stats.total} 次</strong>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label={`${habit.name} ${formatChineseMonth(year, monthIndex)} 月历`}>
        {getWeekdayLabels().map((label) => (
          <div className="weekday" role="columnheader" key={label}>
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.date) {
            return <div className="calendar-day is-empty" role="gridcell" key={`empty-${index}`} />;
          }

          const checked = checkedDates.has(cell.date);
          const isToday = cell.date === today;
          const isFuture = cell.date > today;
          return (
            <button
              type="button"
              role="gridcell"
              className={`calendar-day${checked ? " is-checked" : ""}${isToday ? " is-today" : ""}`}
              style={{ "--habit-color": habit.color } as React.CSSProperties}
              key={cell.date}
              disabled={isFuture}
              aria-pressed={checked}
              aria-label={`${cell.date}，${checked ? "已打卡，点击取消" : isFuture ? "未来日期" : "未打卡，点击补打卡"}`}
              onClick={() => onToggle(cell.date as DateKey)}
            >
              <span>{cell.day}</span>
              {checked && <i aria-hidden="true">✓</i>}
            </button>
          );
        })}
      </div>

      <p className="calendar-hint">点击过去或今天的日期，可以补打卡或取消打卡。</p>
    </section>
  );
}
