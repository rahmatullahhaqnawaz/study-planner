import { CircleCheck, Clock, ListChecks } from "lucide-react";
import Ring from "./Ring";

export default function ProgressCard({ stats, focusMinutes }) {
  const remaining = stats.total - stats.completed;
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Your progress</h2>
        <span className="underline-num">{stats.percent}%</span>
      </div>
      <div className="progress-body">
        <Ring percent={stats.percent}>
          <span className="ring-num">{stats.percent}%</span>
          <span className="ring-sub">{stats.doneHours}/{stats.totalHours}h</span>
        </Ring>
        <ul className="mini-stats">
          <li><span className="mini-icon green"><CircleCheck size={18} /></span>
            <div><b>{stats.completed} / {stats.total}</b><small>Tasks completed</small></div></li>
          <li><span className="mini-icon blue"><Clock size={18} /></span>
            <div><b>{(focusMinutes / 60).toFixed(1)}h</b><small>Focused today</small></div></li>
          <li><span className="mini-icon purple"><ListChecks size={18} /></span>
            <div><b>{remaining}</b><small>Tasks remaining</small></div></li>
        </ul>
      </div>
    </section>
  );
}
