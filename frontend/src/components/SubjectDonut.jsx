import { courseColor } from "../colors";
import { hoursByCourse } from "../stats";

export default function SubjectDonut({ tasks }) {
  const rows = hoursByCourse(tasks);
  const total = rows.reduce((s, r) => s + r.hours, 0);
  const size = 140, stroke = 22, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <section className="panel">
      <h2>Subject breakdown</h2>
      {total === 0 ? (
        <p className="muted">Add tasks to see where your hours go.</p>
      ) : (
        <div className="donut-wrap">
          <div className="ring" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
              {rows.map((row) => {
                const len = (row.hours / total) * c;
                const seg = (
                  <circle key={row.course} cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={courseColor(row.course)} strokeWidth={stroke}
                    strokeDasharray={`${Math.max(len - 2, 0.5)} ${c}`} strokeDashoffset={-offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`} />
                );
                offset += len;
                return seg;
              })}
            </svg>
            <div className="ring-center"><span className="ring-num">{total}h</span><span className="ring-sub">Total</span></div>
          </div>
          <ul className="donut-legend">
            {rows.slice(0, 6).map((row) => (
              <li key={row.course}>
                <span className="dot-color" style={{ background: courseColor(row.course) }} />
                <span className="name">{row.course}</span>
                <span className="val">{row.hours}h ({Math.round((row.hours / total) * 100)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
