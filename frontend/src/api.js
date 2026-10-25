const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const OFFLINE = "Can't reach the planner. Is uvicorn running on port 8000?";

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(OFFLINE);
  }
  if (res.status === 422) throw new Error("Some data is invalid. Check your tasks and settings.");
  if (!res.ok) throw new Error(`The planner returned an error (${res.status}).`);
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error(`Server responded ${res.status}`);
  return res.json();
}

// Returns { days: [{ date, blocks: [{ start, end, ... }] }], at_risk: [...] }
export function generatePlan(tasks, availability) {
  return post("/api/schedule", { tasks, availability });
}

// Returns { answer, source: "ai" | "offline" }
export function askAssistant(question, tasks) {
  return post("/api/assistant", { question, tasks });
}
