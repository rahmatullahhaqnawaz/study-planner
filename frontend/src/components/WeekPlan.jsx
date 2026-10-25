import { useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, TriangleAlert } from "lucide-react";
import { addDays, dayMonth, todayISO, weekdayShort } from "../dates";
import { courseColor } from "../colors";

const ROW = 26; // pixels per hour in the time grid

const REASON = {
  overdue: "deadline has passed",
  not_enough_time: "not enough time before the deadline",
};

const hourOf = (hhmm) => Number(hhmm.slice(0, 2));

export default function WeekPlan({ plan, tasks, outdated, loading, error, onGenerate, onToggle }) {
  const [offset, setOffset] = useState(0); // 0 = next 7 days, 1 = the 7 after...
  const [mode, setMode] = useState("week");

  // Show 7 days starting today, so the plan is never half in the past
  const firstDay = addDays(todayISO(), offset * 7);
  const week = Array.from({ length: 7 }, (_, i) => addDays(firstDay, i));
  const byDate = new Map((plan?.days || []).map((d) => [d.date, d]));
  const done = new Set(tasks.filter((t) => t.completed).map((t) => t.id));
  const openTasks = tasks.filter((t) => !t.completed).length;

  // Hours shown in the grid: from the earliest block to the latest, at least 8 rows
  const blocks = week.flatMap((d) => byDate.get(d)?.blocks || []);
  let first = Math.min(...blocks.map((b) => hourOf(b.start)), 9);
  let last = Math.max(...blocks.map((b) => hourOf(b.end)), first + 8);
  first = Math.max(0, first);
  last = Math.min(24, last);
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  return (
    <section className="panel plan">
      <div className="plan-head">
        <div>
          <h2>Weekly study plan</h2>
          <p className="muted">{dayMonth(week[0])} – {dayMonth(week[6])}</p>
        </div>
        <div className="plan-controls">
          <div className="week-nav">
            <button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous week"><ChevronLeft size={18} /></button>
            <button className="chip-btn" onClick={() => setOffset(0)}>{offset === 0 ? "Next 7 days" : "Back to today"}</button>
            <button className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="Next week"><ChevronRight size={18} /></button>
          </div>
          <div className="segmented" role="tablist">
            {["week", "list"].map((m) => (
              <button key={m} role="tab" aria-selected={mode === m}
                className={mode === m ? "active" : ""} onClick={() => setMode(m)}>
                {m === "week" ? "Week" : "List"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="banner error-banner">{error}</p>}
      {outdated && plan && !error && (
        <div className="banner info-banner">
          <span>Your tasks changed since this plan was made.</span>
          <button className="btn small" onClick={onGenerate} disabled={loading}>
            {loading ? <LoaderCircle size={14} className="spin" /> : "Regenerate"}
          </button>
        </div>
      )}
      {plan && plan.at_risk.length > 0 && (
        <div className="banner warn-banner">
          <TriangleAlert size={18} />
          <div>
            <strong>Doesn't fit:</strong>
            <ul>
              {plan.at_risk.map((r) => (
                <li key={r.task_id}>{r.title}: {r.hours_unscheduled}h missing ({REASON[r.reason]})</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!plan ? (
        <div className="empty-plan">
          <p>{openTasks === 0 ? "Add a task, then generate your plan." : "Ready to plan your week."}</p>
          <button className="btn gradient" onClick={onGenerate} disabled={loading || openTasks === 0}>
            {loading ? "Planning…" : "Generate my study plan"}
          </button>
        </div>
      ) : mode === "week" ? (
        <div className="grid-scroll">
          <div className="time-grid" style={{ "--rows": hours.length - 1, "--row": `${ROW}px` }}>
            <div className="corner" />
            {week.map((d) => (
              <div key={d} className={d === todayISO() ? "col-head today" : "col-head"}>
                <b>{weekdayShort(d)}</b><span>{dayMonth(d)}</span>
              </div>
            ))}
            <div className="hours">
              {hours.filter((h) => h % 2 === first % 2).map((h) => (
                <span key={h} style={{ top: (h - first) * ROW }}>{String(h).padStart(2, "0")}:00</span>
              ))}
            </div>
            {week.map((d) => (
              <div key={d} className={d === todayISO() ? "col today" : "col"}>
                {(byDate.get(d)?.blocks || []).map((b) => {
                  const color = courseColor(b.course);
                  const isDone = done.has(b.task_id);
                  return (
                    <button key={b.task_id} className={`event${isDone ? " done" : ""}${b.hours === 1 ? " short" : ""}`}
                      style={{ top: (hourOf(b.start) - first) * ROW + 2, height: b.hours * ROW - 4, background: color }}
                      onClick={() => onToggle(b.task_id)}
                      title={`${b.title} · ${b.start}–${b.end} · click to mark ${isDone ? "not done" : "done"}`}>
                      <span className="event-title">{b.title}</span>
                      <span className="event-time">{b.start} – {b.end}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ul className="plan-list">
          {week.map((d) => {
            const day = byDate.get(d);
            if (!day || day.blocks.length === 0) return null;
            return (
              <li key={d}>
                <div className="plan-list-day">{weekdayShort(d)} {dayMonth(d)} <span className="muted">· {day.planned_hours}/{day.available_hours}h</span></div>
                {day.blocks.map((b) => (
                  <div key={b.task_id} className={done.has(b.task_id) ? "plan-list-item done" : "plan-list-item"}>
                    <span className="dot-color" style={{ background: courseColor(b.course) }} />
                    <span className="time">{b.start}–{b.end}</span>
                    <span>{b.title} <span className="muted">· {b.course}</span></span>
                  </div>
                ))}
              </li>
            );
          })}
          {week.every((d) => !(byDate.get(d)?.blocks.length)) && <li className="muted">Nothing planned this week.</li>}
        </ul>
      )}
    </section>
  );
}
