import { useState } from "react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function Settings({ name, availability, onName, onAvailability, onReset }) {
  const [confirming, setConfirming] = useState(false);
  const weekly = DAYS.reduce((s, d) => s + availability[d], 0);

  function setDay(day, value) {
    const n = Math.max(0, Math.min(24, Math.round(Number(value) || 0)));
    onAvailability({ ...availability, [day]: n });
  }

  return (
    <div className="settings">
      <section className="panel">
        <h2>Profile</h2>
        <div className="field">
          <label htmlFor="name">Your name</label>
          <input id="name" value={name} maxLength={30} onChange={(e) => onName(e.target.value)} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Study hours</h2>
          <span className="muted small">{weekly}h per week</span>
        </div>
        <p className="muted">How many hours you can study each day. The planner never schedules more than this.</p>
        <div className="field">
          <label htmlFor="day-start">Start studying at</label>
          <select id="day-start" value={availability.day_start}
            onChange={(e) => onAvailability({ ...availability, day_start: Number(e.target.value) })}>
            {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
            ))}
          </select>
        </div>
        <div className="day-hours">
          {DAYS.map((d) => (
            <div key={d} className="field">
              <label htmlFor={`h-${d}`}>{d.slice(0, 3)}</label>
              <input id={`h-${d}`} type="number" min="0" max="24" value={availability[d]}
                onChange={(e) => setDay(d, e.target.value)} />
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Data</h2>
        <p className="muted">Your tasks, plan and focus sessions are saved in this browser only.</p>
        {confirming ? (
          <div className="confirm">
            <span>Delete all tasks, plans and focus history?</span>
            <button className="btn small danger-btn" onClick={() => { onReset(); setConfirming(false); }}>Delete everything</button>
            <button className="btn small ghost-btn" onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn small ghost-btn" onClick={() => setConfirming(true)}>Reset all data</button>
        )}
      </section>
    </div>
  );
}
