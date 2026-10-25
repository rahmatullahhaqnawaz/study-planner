import { useState } from "react";
import { ArrowRight, Bell, Search } from "lucide-react";

export default function Topbar({ name, overdue, backend, onAsk }) {
  const [text, setText] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAsk(text.trim());
    setText("");
  }

  const initials = name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "S";

  return (
    <header className="topbar">
      <form className="search" onSubmit={submit}>
        <Search size={18} className="search-icon" />
        <input id="topbar-ask" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Ask anything… (e.g. how should I prepare for my exam?)" aria-label="Ask the assistant" />
        <button type="submit" className="icon-btn accent" aria-label="Ask"><ArrowRight size={18} /></button>
      </form>

      <div className="top-right">
        <span className={`status ${backend}`} title="Backend status">
          <span className="dot" />
          {backend === "connected" ? "Online" : backend === "offline" ? "Offline" : "…"}
        </span>
        <button className="icon-btn bell" aria-label={`${overdue} overdue tasks`}>
          <Bell size={20} />
          {overdue > 0 && <span className="badge">{overdue}</span>}
        </button>
        <div className="user">
          <span className="avatar">{initials}</span>
          <div className="user-text">
            <div className="hello">Hello, {name}!</div>
            <div className="keep">Keep going ✨</div>
          </div>
        </div>
      </div>
    </header>
  );
}
