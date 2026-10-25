import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { courseColor } from "../colors";
import { daysUntil, dueText, formatDay } from "../dates";

const PRIORITY = { 1: "High", 2: "Medium", 3: "Low" };
const FILTERS = [["open", "Open"], ["done", "Done"], ["all", "All"]];

export default function TaskList({ tasks, onToggle, onDelete }) {
  const [filter, setFilter] = useState("open");

  const shown = tasks
    .filter((t) => (filter === "all" ? true : filter === "done" ? t.completed : !t.completed))
    .sort((a, b) => a.completed - b.completed || a.deadline.localeCompare(b.deadline) || a.priority - b.priority);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>My tasks <span className="count">{tasks.length}</span></h2>
        <div className="segmented">
          {FILTERS.map(([v, label]) => (
            <button key={v} className={filter === v ? "active" : ""} onClick={() => setFilter(v)}>{label}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="muted">{tasks.length === 0 ? "No tasks yet. Add your first one with the form." : "Nothing here."}</p>
      ) : (
        <ul className="task-list">
          {shown.map((t) => {
            const late = !t.completed && daysUntil(t.deadline) < 0;
            return (
              <li key={t.id} className={t.completed ? "task done" : "task"}>
                <button className={t.completed ? "check on" : "check"} onClick={() => onToggle(t.id)}
                  aria-label={`Mark ${t.title} ${t.completed ? "not done" : "done"}`} aria-pressed={t.completed}>
                  {t.completed && <Check size={14} strokeWidth={3} />}
                </button>
                <span className="bar-color" style={{ background: courseColor(t.course) }} />
                <div className="task-text">
                  <span className="task-title">{t.title}</span>
                  <span className="task-meta">
                    {t.course} · {t.est_hours}h · {formatDay(t.deadline)}
                    {!t.completed && <> · <span className={late ? "late" : ""}>{dueText(t.deadline)}</span></>}
                  </span>
                </div>
                <span className={`pill p${t.priority}`}>{PRIORITY[t.priority]}</span>
                <button className="icon-btn danger" onClick={() => onDelete(t.id)} aria-label={`Delete ${t.title}`}>
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
