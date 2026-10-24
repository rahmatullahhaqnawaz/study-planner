const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error(`Server responded ${res.status}`);
  return res.json();
}