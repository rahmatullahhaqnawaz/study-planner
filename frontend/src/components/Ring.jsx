import { useId } from "react";

// A circular progress ring. percent: 0-100
export default function Ring({ percent, size = 140, stroke = 14, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = `ring${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(percent, 100) / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
