import { ArrowRight, LoaderCircle, Plus } from "lucide-react";

// An original illustration: a floating planner card with checklist and clock
function Illustration() {
  return (
    <svg className="hero-art" viewBox="0 0 320 220" aria-hidden="true">
      <defs>
        <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
        <linearGradient id="clock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="2" fill="#a5b4fc" />
      <circle cx="290" cy="30" r="2.5" fill="#c4b5fd" />
      <circle cx="300" cy="180" r="2" fill="#a5b4fc" />
      <circle cx="70" cy="190" r="1.5" fill="#c4b5fd" />
      <g className="float-a">
        <rect x="90" y="40" width="150" height="160" rx="18" fill="url(#card)" />
        <rect x="90" y="40" width="150" height="38" rx="18" fill="#ffffff" opacity="0.12" />
        <circle cx="120" cy="38" r="6" fill="#e0e7ff" />
        <circle cx="210" cy="38" r="6" fill="#e0e7ff" />
        {[98, 128, 158].map((y, i) => (
          <g key={y}>
            <rect x="110" y={y} width="20" height="20" rx="6" fill={i < 2 ? "#34d399" : "#ffffff"} opacity={i < 2 ? 1 : 0.25} />
            {i < 2 && <path d={`M115 ${y + 10} l4 4 l7 -8`} stroke="#064e3b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="140" y={y + 4} width={i === 1 ? 60 : 80} height="5" rx="2.5" fill="#ffffff" opacity="0.85" />
            <rect x="140" y={y + 13} width="44" height="4" rx="2" fill="#ffffff" opacity="0.4" />
          </g>
        ))}
      </g>
      <g className="float-b">
        <circle cx="250" cy="150" r="36" fill="url(#clock)" />
        <circle cx="250" cy="150" r="27" fill="#0b1026" />
        <path d="M250 133 v17 l11 8" stroke="#e0f2fe" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      <g className="float-c">
        <path d="M58 92 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 z" fill="#facc15" />
      </g>
    </svg>
  );
}

export default function Hero({ openTasks, loading, hasPlan, onGenerate, onAddTask }) {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Your <span className="grad">Smart</span><br />Study Planner</h1>
        <p>Turn your deadlines into a clear weekly plan. Add tasks, generate a schedule, and track every hour you finish.</p>
        <div className="hero-actions">
          <button className="btn gradient" onClick={onGenerate} disabled={loading || openTasks === 0}>
            {loading ? <LoaderCircle size={18} className="spin" /> : null}
            {loading ? "Planning…" : hasPlan ? "Regenerate my plan" : "Generate my study plan"}
            {!loading && <ArrowRight size={18} />}
          </button>
          <button className="btn outline" onClick={onAddTask}><Plus size={18} /> Add task</button>
        </div>
        {openTasks === 0 && <p className="hint">Add your first task to unlock the plan.</p>}
      </div>
      <div className="hero-visual">
        <div className="bubble">Let's make this week productive! ✨</div>
        <Illustration />
      </div>
    </section>
  );
}
