import { useEffect, useState } from "react";
import { COLOR_PRESETS, EMOJI_PRESETS, validateHabitName } from "../domain/habits";
import type { Habit, HabitInput } from "../domain/types";

interface HabitDialogProps {
  open: boolean;
  habit: Habit | null;
  onSave: (input: HabitInput) => void;
  onArchive: (() => void) | null;
  onClose: () => void;
}

export function HabitDialog({ open, habit, onSave, onArchive, onClose }: HabitDialogProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(EMOJI_PRESETS[0]);
  const [color, setColor] = useState<string>(COLOR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? "");
    setEmoji(habit?.emoji ?? EMOJI_PRESETS[0]);
    setColor(habit?.color ?? COLOR_PRESETS[0]);
    setError(null);
  }, [habit, open]);

  if (!open) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateHabitName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave({ name: name.trim(), emoji, color });
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="habit-dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{habit ? "编辑" : "新建"}</p>
            <h2 id="habit-dialog-title">{habit ? "编辑习惯" : "添加习惯"}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="field">
            <span>习惯名称</span>
            <input
              autoFocus
              maxLength={24}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="例如：阅读 20 分钟"
            />
          </label>
          {error && <p className="form-error">{error}</p>}

          <fieldset className="choice-field">
            <legend>图标</legend>
            <div className="emoji-options">
              {EMOJI_PRESETS.map((item) => (
                <button
                  type="button"
                  className={`emoji-choice${emoji === item ? " is-active" : ""}`}
                  aria-pressed={emoji === item}
                  key={item}
                  onClick={() => setEmoji(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="choice-field">
            <legend>颜色</legend>
            <div className="color-options">
              {COLOR_PRESETS.map((item) => (
                <button
                  type="button"
                  className={`color-choice${color === item ? " is-active" : ""}`}
                  aria-label={`选择颜色 ${item}`}
                  aria-pressed={color === item}
                  key={item}
                  style={{ backgroundColor: item }}
                  onClick={() => setColor(item)}
                />
              ))}
            </div>
          </fieldset>

          <div className="dialog-actions">
            {habit && onArchive && (
              <button type="button" className="danger-button" onClick={onArchive}>
                删除习惯
              </button>
            )}
            <span className="dialog-spacer" />
            <button type="button" className="secondary-button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="primary-button">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
