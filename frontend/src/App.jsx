import { useEffect, useState } from "react";
import { checkHealth } from "./api";

export default function App() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    checkHealth()
      .then(() => setStatus("connected"))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Study Planner</h1>
      {status === "checking" && <p>Checking backend…</p>}
      {status === "connected" && <p style={{ color: "green" }}>✅ Backend connected</p>}
      {status === "offline" && (
        <p style={{ color: "crimson" }}>
          ❌ Can't reach the planner. Is uvicorn running on port 8000?
        </p>
      )}
    </main>
  );
}