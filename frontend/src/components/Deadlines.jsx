import { courseColor } from "../colors";
import { daysUntil, dueText, formatDay } from "../dates";

export default function Deadlines({ tasks, onViewAll, limit = 5 }) {
  const upcoming = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, limit);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Upcoming deadlines</h2>
        {onViewAll && <button className="link" onClick={onViewAll}>View all</button>}
      </div>
      {upcoming.length === 0 ? (
        <p className="muted">No open deadlines. Nice.</p>
      ) : (
        <ul className="deadlines">
          {upcoming.map((t) => {
            const days = daysUntil(t.deadline);
            const tone = days < 0 ? "red" : days <= 3 ? "orange" : "green";
            return (
              <li key={t.id}>
                <span className="sq" style={{ background: courseColor(t.course) }} />
                <div className="dl-text">
                  <b>{t.title}</b>
                  <small>{t.course} · {formatDay(t.deadline)}</small>
                </div>
                <span className={`days ${tone}`}>{dueText(t.deadline)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
