import { Pause, Play, RotateCcw } from "lucide-react";
import Ring from "./Ring";

const LENGTHS = [25, 50, 5];

export default function FocusTimer({ timer, tasks, focusTaskId, onPickTask, large = false }) {
  const mm = String(Math.floor(timer.secondsLeft / 60)).padStart(2, "0");
  const ss = String(timer.secondsLeft % 60).padStart(2, "0");
  const open = tasks.filter((t) => !t.completed);

  return (
    <section className={large ? "panel focus large" : "panel focus"}>
      <h2>Focus mode</h2>
      <div className="focus-body">
        <Ring percent={timer.percent} size={large ? 240 : 150} stroke={large ? 14 : 10}>
          <span className="timer-num">{mm}:{ss}</span>
          <button className="btn small primary" onClick={timer.running ? timer.pause : timer.start}>
            {timer.running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start</>}
          </button>
        </Ring>
        <div className="focus-side">
          <div className="segmented">
            {LENGTHS.map((m) => (
              <button key={m} className={timer.length === m ? "active" : ""}
                onClick={() => timer.setLength(m)} disabled={timer.running}>
                {m === 5 ? "Break 5" : `${m} min`}
              </button>
            ))}
          </div>
          <label htmlFor={large ? "focus-task-l" : "focus-task"} className="sr-label">Working on</label>
          <select id={large ? "focus-task-l" : "focus-task"} value={focusTaskId}
            onChange={(e) => onPickTask(e.target.value)}>
            <option value="">General study</option>
            {open.map((t) => <option key={t.id} value={t.id}>{t.title} ({t.course})</option>)}
          </select>
          <button className="btn small ghost-btn" onClick={timer.reset}>
            <RotateCcw size={14} /> Stop and save time
          </button>
          <p className="quote">"Small steps every day lead to big results."</p>
        </div>
      </div>
    </section>
  );
}
