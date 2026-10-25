import { CircleAlert, CircleCheck, Flame, ListTodo } from "lucide-react";

export default function StatTiles({ stats }) {
  const tiles = [
    { label: "Total tasks", value: stats.total, icon: ListTodo, tone: "blue" },
    { label: "Completed", value: stats.completed, icon: CircleCheck, tone: "green" },
    { label: "In progress", value: stats.inProgress, icon: Flame, tone: "orange" },
    { label: "Overdue", value: stats.overdue, icon: CircleAlert, tone: "red" },
  ];
  return (
    <div className="tiles">
      {tiles.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="tile panel">
          <span className={`tile-icon ${tone}`}><Icon size={24} /></span>
          <div>
            <div className="tile-value">{value}</div>
            <div className="tile-label">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
