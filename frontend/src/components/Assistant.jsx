import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, LoaderCircle } from "lucide-react";

const CHIPS = [
  "Create a study plan for my exam",
  "Break down my biggest task",
  "What should I do next?",
  "Give me revision tips",
];

export default function Assistant({ messages, loading, onAsk, compact = false }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const shown = compact ? messages.slice(-2) : messages;

  useEffect(() => {
    if (!compact) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, compact]);

  function submit(e) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onAsk(text.trim());
    setText("");
  }

  return (
    <section className={compact ? "panel assistant compact" : "panel assistant"}>
      <div className="assistant-head">
        <span className="bot"><Bot size={26} /></span>
        <div>
          <h2>AI study assistant</h2>
          <p className="muted">Ask me anything about your studies.</p>
        </div>
      </div>

      <div className="chips">
        {CHIPS.map((c) => (
          <button key={c} className="chip" onClick={() => onAsk(c)} disabled={loading}>{c}</button>
        ))}
      </div>

      {shown.length > 0 && (
        <div className="messages">
          {shown.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.text}
              {m.source && <span className="source">{m.source === "ai" ? "AI answer" : "Offline tips"}</span>}
            </div>
          ))}
          {loading && <div className="msg assistant"><LoaderCircle size={16} className="spin" /> Thinking…</div>}
          <div ref={endRef} />
        </div>
      )}

      <form className="ask" onSubmit={submit}>
        <input id={compact ? "ask-compact" : "ask-full"} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Type your question here…" aria-label="Your question" />
        <button type="submit" className="icon-btn accent" disabled={loading} aria-label="Send"><ArrowRight size={18} /></button>
      </form>
    </section>
  );
}
