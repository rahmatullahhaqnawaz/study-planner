import { addDays, todayISO, weekdayShort } from "../dates";

const BAR_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#a855f7", "#f59e0b", "#6366f1", "#f43f5e"];

// Hours you focused on each of the last 7 days (from Focus mode sessions)
export default function StudyChart({ focusLog }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i - 6));
  const data = days.map((d) => ({
    date: d,
    hours: focusLog.filter((f) => f.date === d).reduce((s, f) => s + f.minutes, 0) / 60,
  }));

  const max = Math.max(...data.map((d) => d.hours));
  const top = max <= 1 ? 1 : Math.ceil(max / 2) * 2;
  const ticks = [0, top / 2, top];
  const W = 250, H = 150, L = 30, B = 20, T = 8;
  const plotH = H - B - T;
  const colW = (W - L) / 7;
  const y = (v) => T + plotH - (v / top) * plotH;
  const total = data.reduce((s, d) => s + d.hours, 0);
  const label = (v) => (v < 1 && v > 0 ? `${v * 60}m` : `${v}h`);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Study time</h2>
        <span className="muted small">Last 7 days · {total.toFixed(1)}h</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Hours focused per day, last 7 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} className="gridline" />
            <text x={L - 5} y={y(t) + 3.5} className="axis" textAnchor="end">{label(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = L + i * colW + colW / 2;
          const bw = colW * 0.5;
          return (
            <g key={d.date}>
              {d.hours > 0 && (
                <rect x={x - bw / 2} y={y(d.hours)} width={bw} height={y(0) - y(d.hours)} rx="3" fill={BAR_COLORS[i]}>
                  <title>{`${d.date}: ${d.hours.toFixed(1)}h`}</title>
                </rect>
              )}
              <text x={x} y={H - 5} className={d.date === todayISO() ? "axis today" : "axis"} textAnchor="middle">
                {weekdayShort(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
      {total === 0 && <p className="muted small chart-empty">Finish a focus session to see your study time here.</p>}
    </section>
  );
}
