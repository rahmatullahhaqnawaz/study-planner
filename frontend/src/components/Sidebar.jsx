import { CalendarDays, ChartColumn, GraduationCap, House, Settings, Sparkles, SquareCheckBig, Timer } from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: House },
  { id: "tasks", label: "My Tasks", icon: SquareCheckBig },
  { id: "planner", label: "Study Planner", icon: CalendarDays },
  { id: "assistant", label: "AI Assistant", icon: Sparkles },
  { id: "analytics", label: "Analytics", icon: ChartColumn },
  { id: "focus", label: "Focus Mode", icon: Timer },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ view, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon"><GraduationCap size={26} /></span>
        <div>
          <div className="brand-name">Study Planner</div>
          <div className="brand-tag">Plan smarter. Finish on time.</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate(id)} aria-current={view === id ? "page" : undefined}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="quote-card">
        <p>"Discipline today creates freedom tomorrow."</p>
      </div>
    </aside>
  );
}
